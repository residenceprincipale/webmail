const { ImapFlow } = require("imapflow");

const HOST = process.argv[2] || "127.0.0.1";
const PORT = Number(process.argv[3] || 9143);
const USER = process.argv[4] || "imaptest@example.com";
const PASS = process.argv[5] || "supersecret123456";

const client = new ImapFlow({
  host: HOST,
  port: PORT,
  secure: true,
  auth: { user: USER, pass: PASS },
  logger: false,
  tls: { rejectUnauthorized: false },
});

(async () => {
  try {
    await client.connect();
    console.log("AUTH OK");
    const boxes = await client.list();
    console.log("BOXES:", boxes.map((b) => `${b.path}${b.specialUse ? " " + b.specialUse : ""}`).join(" | "));

    await client.mailboxOpen("INBOX");
    console.log("SELECT INBOX ok, exists:", client.mailbox.exists);

    const msgs = [];
    for await (const m of client.fetch("1:*", { envelope: true, flags: true, uid: true, bodyStructure: true })) {
      msgs.push(m);
    }
    console.log("FETCHED:", msgs.length);
    for (const m of msgs) {
      console.log(
        `  uid=${m.uid} flags=${[...m.flags].join(",")} subj="${m.envelope?.subject}" from=${m.envelope?.from?.[0]?.address}`,
      );
    }

    const one = await client.fetchOne("1", { envelope: true, flags: true, source: true, uid: true }, { uid: true });
    console.log("SOURCE bytes:", one?.source?.length ?? 0);

    await client.logout();
    console.log("LOGOUT OK");
  } catch (e) {
    console.log("ERR:", e.message, "| response:", e.response);
    process.exit(1);
  }
})();
