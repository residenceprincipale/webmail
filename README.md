# Webmail

Gmail-style interface for any IMAP/SMTP mailbox, with real read/write.
OVH presets ship as defaults; any provider works via environment variables.

## Install

Prerequisites: Docker + Compose plugin, or Bun 1+ for local dev.

1. Copy the env file and generate secrets:

```bash
cp .env.example .env
openssl rand -base64 32  # -> WEBMAIL_SESSION_SECRET
openssl rand -base64 32  # -> WEBMAIL_CRON_SECRET
```

2. Edit `.env`:

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `WEBMAIL_SESSION_SECRET` | yes | — | Signs session cookies (min 16 random chars) |
| `WEBMAIL_CRON_SECRET` | yes | — | Guards `/api/cron/*` for the scheduler |
| `WEBMAIL_SECURE_COOKIES` | no | `false` | Set `true` only behind HTTPS |
| `WEBMAIL_IMAP_HOST` | no | `ssl0.ovh.net` | IMAP host prefilled on login |
| `WEBMAIL_SMTP_HOST` | no | login host | SMTP override |
| `WEBMAIL_SMTP_PORT` | no | `465` | SMTP port |
| `WEBMAIL_ALLOWED_IMAP_HOSTS` | no | empty (any) | Comma-separated login host allowlist |
| `WEBMAIL_PASSWORD_PROVIDER` | no | `ovh` | Password-change provider; other values disable the route (501) |
| `OVH_APP_KEY` / `OVH_APP_SECRET` / `OVH_CONSUMER_KEY` | only for OVH password change | — | OVH API token (see below) |
| `OVH_API_ENDPOINT` | no | `ovh-eu` | `ovh-eu`, `ovh-ca`, or `ovh-us` |

3. Start:

```bash
docker compose up -d --build
```

Open http://localhost:3005 and sign in with any IMAP account
(login = full email address). The IMAP host field is editable on the
login page.

## Commands

```bash
docker compose up -d --build    # build + start
docker compose logs -f webmail  # logs
docker compose down             # stop
docker compose down -v          # stop + delete volumes
```

## Local dev without Docker

```bash
bun install
bun run dev
```

## Other providers

Only defaults point at OVH. To use another host:

- set `WEBMAIL_IMAP_HOST` (prefilled login host),
- optionally `WEBMAIL_SMTP_HOST` / `WEBMAIL_SMTP_PORT`,
- optionally lock logins with `WEBMAIL_ALLOWED_IMAP_HOSTS=imap.example.com`,
- set `WEBMAIL_PASSWORD_PROVIDER=none` to disable the OVH password route.

## Password change (OVH)

IMAP/SMTP cannot change a mailbox password, so this goes through the
provider API (`PUT /api/password`, OVH `changePassword` endpoint):

1. Create a token at eu.api.ovh.com/createToken, limited to
   `POST /email/domain/YOUR-DOMAIN/account/*/changePassword`.
2. Put the three keys in `.env` (`OVH_APP_KEY`, `OVH_APP_SECRET`,
   `OVH_CONSUMER_KEY`).

## Stack

- Nuxt 4 + Vue 3
- `imapflow` (IMAP), `nodemailer` (SMTP), `mailparser`
- `isomorphic-dompurify` sanitizes mail HTML
- Server-side sessions; the password never reaches the browser
- 3-stage Docker build (`.output` Nitro)

## Security notes

- Session cookies: `HttpOnly`, `SameSite=Lax`, `Secure` behind HTTPS.
- State-changing routes require same-origin; login is rate-limited.
- Mail HTML is DOMPurify-sanitized before `v-html`.
- IMAP pool keys include a password hash (no cross-account reuse).
- Scheduler secret compared with `timingSafeEqual`.
- Attachment `part` param allowlisted; download filename sanitized.
