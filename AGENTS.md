# AGENTS.md

## Project

Nuxt 4 + Vue 3 webmail (IMAP/SMTP). Server in `server/`, UI in
`components/` + `pages/`, shared i18n in `lib/i18n.ts` (FR + EN dicts).

## Commands

- `bun run dev` — local dev
- `bun run lint` — eslint (must pass)
- `bun run build` — Nuxt build (must pass)
- `docker compose up -d --build` — prod-like run on :3005

## Conventions

- Code and comments in English. Only `lib/i18n.ts` holds French strings.
- No new comments unless the why is non-obvious. No JSDoc on typed code.
- Keep diffs minimal: no drive-by refactors, no new deps without need.
- Provider defaults live in `server/utils/provider.ts` (`WEBMAIL_*` env).
  OVH stays the default; new providers go behind `WEBMAIL_PASSWORD_PROVIDER`.
- Never log or persist plaintext passwords beyond the existing session
  cookie and the one-shot scheduler stash (mode 0600, deleted after send).
- Mail HTML must stay behind `DOMPurify.sanitize` before `v-html`.
- State-changing API routes: `assertSameOrigin` + session check.
- Validate untrusted input at route boundary (host allowlist regex,
  `part` allowlist, attachment size caps, photo data-URL check).

## Env

Copy `.env.example` to `.env`. Secrets: `WEBMAIL_SESSION_SECRET`,
`WEBMAIL_CRON_SECRET` (`openssl rand -base64 32` each).

## Gotchas

- IMAP pool key includes a password hash; same login + new password must
  not reuse the old connection.
- i18n `TKey` is derived from `FR_STRINGS`; keep both locales in sync.
- `formatSize` takes a locale param; pass `locale` from `useI18n`.
- Design page (`pages/design.vue`) is a component gallery, not app UI.
- `test/` holds manual probes (fake IMAP, XSS), not a CI suite.
