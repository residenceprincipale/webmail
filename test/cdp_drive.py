"""Pilote l'onglet Chrome reel (session utilisateur) via CDP pour tester le webmail de bout en bout."""
import base64
import json
import sys
import time
import urllib.request

sys.path.insert(0, "/Users/9p/Documents/Github/webmail/test")
from ws_min import Ws

CDP = "http://127.0.0.1:9222"
SHOTS = "/Users/9p/Documents/Github/webmail/docs/screenshots"


def http(path):
    with urllib.request.urlopen(CDP + path, timeout=30) as r:
        return json.loads(r.read())


class Cdp:
    """Reconnecte si la page navigue (le WebSocket meurt alors)."""

    def __init__(self, substr="mailbox"):
        self.substr = substr
        self.ws = None
        self.mid = 0
        self.connect()

    def connect(self):
        tabs = [t for t in http("/json/list") if t["type"] == "page" and self.substr in t.get("url", "")]
        if not tabs:
            raise SystemExit(f"onglet {self.substr!r} introuvable")
        self.ws = Ws(tabs[0]["webSocketDebuggerUrl"])

    def send(self, method, **params):
        self.mid += 1
        self.ws.send({"id": self.mid, "method": method, "params": params})
        while True:
            try:
                msg = json.loads(self.ws.recv())
            except (ConnectionError, OSError):
                time.sleep(2)
                self.mid += 1
                self.ws = None
                self.connect()
                self.ws.send({"id": self.mid, "method": method, "params": params})
                continue
            if msg.get("id") != self.mid:
                continue
            if "error" in msg:
                raise RuntimeError(f"{method}: {msg['error']}")
            return msg.get("result", {})

    def eval(self, expr, timeout=20):
        try:
            r = self.send("Runtime.evaluate", expression=expr, returnByValue=True, awaitPromise=True)
            if r.get("exceptionDetails"):
                return {"__error": str(r["exceptionDetails"].get("text"))}
            return r.get("result", {}).get("value")
        except Exception as e:
            return {"__error": str(e)}

    def wait(self, expr, timeout=45):
        end = time.time() + timeout
        last = None
        while time.time() < end:
            last = self.eval(expr)
            if last and not (isinstance(last, dict) and "__error" in last):
                return last
            time.sleep(1.0)
        return last

    def shot(self, name):
        r = self.send("Page.captureScreenshot")
        path = f"{SHOTS}/{name}.png"
        with open(path, "wb") as f:
            f.write(base64.b64decode(r["data"]))
        print(f"  capture -> {path}")
        return path

    def goto(self, url):
        self.eval(f"location.href = {json.dumps(url)}")
        time.sleep(3)


JS_STATE = """(() => {
  const txt = document.body.innerText;
  return {
    url: location.pathname,
    boxes: [...document.querySelectorAll('aside nav button')].map(b=>({label:b.textContent.trim()})),
    rows: [...document.querySelectorAll('main ul li')].slice(0,6).map(li=>{
      const spans = [...li.querySelectorAll('span')].map(s=>s.textContent.trim());
      return {subject: spans.find(s=>s.length>3)||''};
    }),
    pagination: (document.querySelector('main .ml-auto span')||{}).textContent||'',
    loading: txt.includes('Chargement'),
    errorText: /indisponibles|erreur|Erreur/.test(txt) ? txt.slice(0,300) : null
  };
})()"""


def fetch_api(path, init=None):
    js = "(async () => { const r = await fetch(%s, %s); const t = await r.text(); return {status: r.status, body: t.slice(0, 600)}; })()"
    return js % (json.dumps(path), json.dumps(init or "{}"))


if __name__ == "__main__":
    cdp = Cdp()
    print("url:", cdp.eval("location.pathname"))
    st = None
    for _ in range(30):
        st = cdp.eval(JS_STATE)
        if isinstance(st, dict) and st.get("rows"):
            break
        time.sleep(2)
    print(json.dumps(st, indent=1, ensure_ascii=False))
    cdp.shot("20-mailbox")
