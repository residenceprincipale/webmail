const net = require("net");
const tls = require("tls");
const fs = require("fs");

const sock = tls.connect(
  { host: "127.0.0.1", port: 9143, rejectUnauthorized: false },
  () => {
    console.log("TLS connected");
  },
);
let buf = "";
sock.on("data", (d) => {
  buf += d.toString();
  if (!sent1 && buf.includes("\r\n")) {
    send1();
  }
});
let sent1 = false;
function send1() {
  sent1 = true;
  sock.write("a1 LOGIN imaptest@example.com supersecret123456\r\n");
  setTimeout(() => sock.write("a2 LIST \"\" \"*\"\r\n"), 200);
  setTimeout(() => sock.write("a3 LOGOUT\r\n"), 800);
  setTimeout(() => {
    console.log("=== RAW ===");
    console.log(JSON.stringify(buf));
    process.exit(0);
  }, 1400);
}
