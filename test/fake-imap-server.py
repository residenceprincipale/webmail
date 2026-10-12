"""Fake IMAP server: enough of the protocol to exercise the webmail against real IMAP wire format.

Not a general IMAP server. Supports the exact fetch/status/list/append/store/move/delete
shapes the app issues. Reads test fixtures from the workspace dir.
"""
import base64
import datetime
import email.utils
import socket
import ssl
import sys
import threading
import pathlib

HOST = "127.0.0.1"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 9143
CREDS = "imaptest@example.com:supersecret123456"

B = chr(92)

MAILBOXES = [
    ("INBOX", B + "\Inbox"),
    ("Sent", B + "\Sent"),
    ("Drafts", B + "\Drafts"),
    ("Archive", B + "\Archive"),
    ("Trash", B + "\Trash"),
]

MSG_1 = (
    "From: Alice Dupont <alice@example.com>\r\n"
    "To: imaptest@example.com\r\n"
    "Subject: Facture de janvier\r\n"
    "Date: Sat, 10 Jan 2026 09:14:00 +0100\r\n"
    "Message-ID: <msg1@example.com>\r\n"
    "Content-Type: text/html; charset=utf-8\r\n"
    "\r\n"
    "<html><body><p>Bonjour, voici la facture.</p><a href='#'>Cliquez ici</a></body></html>"
)

MSG_2 = (
    "From: Bob Martin <bob@example.com>\r\n"
    "To: imaptest@example.com\r\n"
    "Subject: Reunion demain\r\n"
    "Date: Sat, 10 Jan 2026 11:02:00 +0100\r\n"
    "Message-ID: <msg2@example.com>\r\n"
    "Content-Type: text/plain; charset=utf-8\r\n"
    "\r\n"
    "La reunion est deplacee a 14h."
)

MSG_3 = (
    "From: newsletter@example.com\r\n"
    "To: imaptest@example.com\r\n"
    "Subject: Bilan hebdomadaire\r\n"
    "Date: Fri, 09 Jan 2026 08:00:00 +0100\r\n"
    "Message-ID: <msg3@example.com>\r\n"
    "Content-Type: text/plain; charset=utf-8\r\n"
    "\r\n"
    "Votre bilan de la semaine. <script>alert('xss')</script>"
)

def envelope(date, subject, sender, to_addr="imaptest@example.com"):
    frm = f'(("Bob Martin" NIL "bob" "example.com"))' if sender == "bob" else \
          f'(("Alice Dupont" NIL "alice" "example.com"))' if sender == "alice" else \
          f'(("newsletter@example.com" NIL "newsletter" "example.com"))'
    to = f'((NIL NIL "{to_addr.split("@")[0]}" "{to_addr.split("@")[1]}"))'
    return (
        f'("{date}" "{subject}" {frm} NIL NIL {to} NIL NIL NIL '
        f'"<msg@{sender}@example.com>")'
    )


# bodyStructure, envelope and flags per uid. Flags: seen set on odd uids.
MESSAGES = [
    {
        "uid": 3,
        "raw": MSG_3.encode(),
        "flags": [r"\Seen"],
        "envelope": envelope("Fri, 09 Jan 2026 08:00:00 +0100", "Bilan hebdomadaire", "newsletter"),
    },
    {
        "uid": 2,
        "raw": MSG_2.encode(),
        "flags": [],
        "envelope": envelope("Sat, 10 Jan 2026 11:02:00 +0100", "Reunion demain", "bob"),
    },
    {
        "uid": 1,
        "raw": MSG_1.encode(),
        "flags": [r"\Seen", r"\Flagged"],
        "envelope": envelope("Sat, 10 Jan 2026 09:14:00 +0100", "Facture de janvier", "alice"),
    },
]

STATE = {
    "selected": None,
    "uids": [3, 2, 1],
}


class Handler:
    def __init__(self, conn):
        self.conn = conn
        self.f = conn.makefile("rb")
        self.authenticated = False

    def send(self, line):
        self.conn.sendall(line.encode() + b"\r\n")

    def send_raw(self, data):
        self.conn.sendall(data)

    def handle(self):
        self.send("* OK [CAPABILITY IMAP4rev1 SASL-IR LOGIN-REFERRALS ID ENABLE IDLE LITERAL+ AUTH=PLAIN] fake imap ready")
        while True:
            line = self.f.readline()
            if not line:
                return
            text = line.decode(errors="replace").rstrip("\r\n")
            try:
                self.dispatch(text)
            except Exception as exc:
                print("handler error:", exc, file=sys.stderr)

    def dispatch(self, text):
        parts = text.split(" ", 2)
        if len(parts) < 2:
            return
        tag = parts[0]
        cmd = parts[1].upper()
        rest = parts[2] if len(parts) > 2 else ""

        if cmd == "CAPABILITY":
            self.send("* CAPABILITY IMAP4rev1 LOGIN-REFERRALS ID ENABLE IDLE")
            self.send(f"{tag} OK CAPABILITY done")

        elif cmd == "AUTHENTICATE":
            mech = rest.split(" ", 1)[0].strip().upper()
            initial = rest.partition(" ")[2].strip()
            if not initial:
                # SASL-IR absent, continuation attendue
                self.send("+ ")
                initial = self.f.readline().decode(errors="replace").rstrip("\r\n").strip()
            plain = base64.b64decode(initial).decode("utf-8", "replace")
            parts = plain.split("\x00")
            user = parts[1] if len(parts) >= 3 else parts[0]
            pw = parts[-1]
            if user == CREDS.split(":")[0] and pw == CREDS.split(":")[1]:
                self.authenticated = True
                self.send(f"{tag} OK authenticated")
            else:
                self.send(f"{tag} NO [AUTHENTICATIONFAILED] Authentication failed.")

        elif cmd == "LOGIN":
            user, _, pw = rest.partition(" ")
            pw = pw.strip().strip('"')
            if user == CREDS.split(":")[0] and pw == CREDS.split(":")[1]:
                self.authenticated = True
                self.send(f"{tag} OK LOGIN done")
            else:
                self.send(f"{tag} NO [AUTHENTICATIONFAILED] Authentication failed.")

        elif not self.authenticated:
            self.send(f"{tag} NO not authenticated")

        elif cmd == "LIST":
            for path, special in MAILBOXES:
                attrs = "HasNoChildren " + special if special else "HasNoChildren"
                self.send(f'* LIST ({attrs}) "." "{path}"')
            self.send(f"{tag} OK LIST done")

        elif cmd == "STATUS":
            box = rest.split(" ", 1)[0].strip().strip('"')
            count = len(MESSAGES) if box == "INBOX" else 0
            unseen = sum(1 for m in MESSAGES if r"\Seen" not in m["flags"]) if box == "INBOX" else 0
            self.send(f'* STATUS "{box}" (MESSAGES {count} RECENT 0 UIDNEXT {max(STATE["uids"]) + 1} UIDVALIDITY 1 UNSEEN {unseen})')
            self.send(f"{tag} OK STATUS done")

        elif cmd == "SELECT" or cmd == "EXAMINE":
            box = rest.split(" ", 1)[0].strip().strip('"')
            STATE["selected"] = box
            exists = len(MESSAGES) if box == "INBOX" else 0
            self.send(f"* {exists} EXISTS")
            self.send(f"* OK [UIDVALIDITY 1] ok")
            self.send(f"* OK [UIDNEXT {max(STATE['uids']) + 1}] ok")
            self.send(f"* OK [PERMANENTFLAGS (\Seen \Flagged \Deleted \*)] ok")
            self.send(f"{tag} OK [READ-WRITE] SELECT done")

        elif cmd == "SEARCH":
            self.send("* SEARCH 1 2 3")
            self.send(f"{tag} OK SEARCH done")

        elif cmd == "FETCH":
            self.do_fetch(tag, rest)

        elif cmd == "UID":
            uid_rest = rest
            sub = uid_rest.split(" ", 1)[0].upper()
            after = uid_rest.partition(" ")[2]
            if sub == "FETCH":
                self.do_fetch_uid(tag, after)
            elif sub in ("STORE",):
                self.do_store(tag, after)
            elif sub in ("MOVE", "COPY"):
                self.send(f"{tag} OK UID {sub} done")
            else:
                self.send(f"{tag} OK UID {sub} unhandled")
        elif cmd == "STORE":
            self.do_store(tag, rest)

        elif cmd == "COPY" or cmd == "MOVE":
            self.send(f"{tag} OK {cmd} done")

        elif cmd == "EXPUNGE":
            self.send(f"{tag} OK EXPUNGE done")

        elif cmd == "LOGOUT":
            self.send("* BYE logout")
            self.send(f"{tag} OK LOGOUT done")

        elif cmd == "NOOP":
            self.send(f"{tag} OK NOOP done")

        elif cmd == "ID":
            self.send(f"{tag} OK ID done")

        else:
            self.send(f"{tag} OK {cmd} unhandled")

    def resolve_seq(self, token):
        token = token.strip('"')
        if token == "*":
            return [m["uid"] for m in MESSAGES], list(MESSAGES)
        if ":" in token:
            a, b = token.split(":", 1)
            lo = 1 if a == "*" else int(a)
            hi = len(MESSAGES) if b == "*" else int(b)
            selected = MESSAGES[lo - 1 : hi]
            return [m["uid"] for m in selected], selected
        try:
            seq = int(token)
        except ValueError:
            return [], []
        found = [MESSAGES[seq - 1]] if 1 <= seq <= len(MESSAGES) else []
        if not found:
            return [], []
        return [found[0]["uid"]], found

    def do_fetch_uid(self, tag, rest):
        seq_part, _, query_part = rest.partition(" ")
        token = seq_part.strip('"')
        if token == "*":
            found = list(MESSAGES)
            uids = [m["uid"] for m in found]
        else:
            try:
                uid = int(token)
            except ValueError:
                found, uids = [], []
            else:
                found = [m for m in MESSAGES if m["uid"] == uid]
                uids = [m["uid"] for m in found]
        if not found:
            self.send(f"{tag} OK UID FETCH nothing")
            return
        wants = self.parse_fetch_query(query_part, rest)
        for m in found:
            items = ["UID " + str(m["uid"])]
            if "FLAGS" in wants:
                items.append(f"FLAGS ({' '.join(m['flags'])})")
            if "ENVELOPE" in wants:
                items.append(f"ENVELOPE {m['envelope']}")
            if "BODYSTRUCTURE" in wants:
                items.append('BODYSTRUCTURE ("text" "html" ("charset" "utf-8") NIL NIL "7bit" '
                             f'{len(m["raw"])} {len(m["raw"].splitlines())}))')
            if "INTERNALDATE" in wants:
                items.append('INTERNALDATE "10-Jan-2026 09:14:00 +0100"')
            if "RFC822.SIZE" in wants:
                items.append(f"RFC822.SIZE {len(m['raw'])}")
            if "BODY[]" in wants or "BODY.PEEK[]" in wants or "RFC822" in wants:
                items.append(f"BODY[] {self.literal(m['raw']).decode()}")
            self.send(f"* {MESSAGES.index(m) + 1} FETCH (" + ", ".join(items) + ")")
        self.send(f"{tag} OK UID FETCH done")

    def do_fetch(self, tag, rest):
        seq_part, _, query_part = rest.partition(" ")
        uids, found = self.resolve_seq(seq_part)
        self.respond_fetch(tag, uids, found, query_part)

    def respond_fetch(self, tag, uids, found, query_part):
        if not found:
            self.send(f"{tag} OK FETCH nothing")
            return
        wants = self.parse_fetch_query(query_part, "")
        for m in found:
            items = [f"UID {m['uid']}"]
            if "FLAGS" in wants:
                items.append(f"FLAGS ({' '.join(m['flags'])})")
            if "ENVELOPE" in wants:
                items.append(f"ENVELOPE {m['envelope']}")
            if "BODYSTRUCTURE" in wants:
                items.append('BODYSTRUCTURE ("text" "html" ("charset" "utf-8") NIL NIL "7bit" '
                             f'{len(m["raw"])} {len(m["raw"].splitlines())}))')
            if "INTERNALDATE" in wants:
                items.append('INTERNALDATE "10-Jan-2026 09:14:00 +0100"')
            if "RFC822.SIZE" in wants:
                items.append(f"RFC822.SIZE {len(m['raw'])}")
            if "BODY[]" in wants or "BODY.PEEK[]" in wants or "RFC822" in wants:
                items.append(f"BODY[] {self.literal(m['raw']).decode()}")
            self.send(f"* {MESSAGES.index(m) + 1} FETCH (" + ", ".join(items) + ")")
        self.send(f"{tag} OK FETCH done")

    @staticmethod
    def literal(data):
        return f"{{{len(data)}}}\r\n".encode() + data

    def parse_fetch_query(self, query_part, _full):
        q = (query_part or "").upper().replace("(", " ")
        wants = []
        for w in ("UID", "FLAGS", "ENVELOPE", "BODYSTRUCTURE", "INTERNALDATE", "RFC822.SIZE",
                  "BODY.PEEK[]", "BODY[]", "RFC822"):
            if w in q or w == "BODY[]" and "BODY[]" in q:
                wants.append(w)
        if not wants:
            wants = ["UID"]
        return wants

    def do_store(self, tag, rest):
        seq_part, _, rest2 = rest.partition(" ")
        op = rest2.split(" ", 1)[0] if rest2 else ""
        remainder = rest2[len(op):].strip()
        flags_part = remainder.split(" ", 1)[0] if remainder else ""
        rest3 = remainder[len(flags_part):].strip()
        by_uid = rest3.upper().startswith("UID")
        new_flags = [f for f in flags_part.strip("()").split() if f]
        if by_uid:
            token = seq_part
            try:
                target = int(token.strip('"'))
            except ValueError:
                found = []
            else:
                found = [m for m in MESSAGES if m["uid"] == target]
        else:
            token = seq_part.strip('"')
            try:
                seq = int(token)
            except ValueError:
                found = []
            else:
                found = [MESSAGES[seq - 1]] if 1 <= seq <= len(MESSAGES) else []
        for m in found:
            if op == "+":
                m["flags"] = sorted(set(m["flags"]) | set(new_flags))
            else:
                m["flags"] = [f for f in m["flags"] if f not in new_flags]
            self.send(f"* {MESSAGES.index(m) + 1} FETCH (UID {m['uid']} FLAGS ({' '.join(m['flags'])}))")
        self.send(f"{tag} OK STORE done")

    def do_fetch_old(self, tag, rest):
        seq_part, _, query_part = rest.partition(" ")
        uids, found = self.resolve_seq(seq_part)
        self.respond_fetch(tag, uids, found, query_part)


def serve(conn, addr):
    try:
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.load_cert_chain("/tmp/imapserver.crt", "/tmp/imapserver.key")
        secure = ctx.wrap_socket(conn, server_side=True)
        Handler(secure).handle()
    except Exception as exc:
        print("serve error:", exc, file=sys.stderr)
    finally:
        try:
            conn.close()
        except Exception:
            pass


def main():
    if not pathlib.Path("/tmp/imapserver.crt").exists():
        raise SystemExit("missing /tmp/imapserver.crt, run openssl first")
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind((HOST, PORT))
    srv.listen(5)
    print(f"fake imap on {HOST}:{PORT}", flush=True)
    while True:
        conn, addr = srv.accept()
        threading.Thread(target=serve, args=(conn, addr), daemon=True).start()


main()
