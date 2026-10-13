# RSSF

Open-source form builder on Cloudflare. A prompt becomes structured form JSON via Workers AI. Owners sign in with Google. Anyone with a published link can submit. Answers live in D1.

Public site: http://reallysupersimpleform.com/

## Stack

- One Worker: React SPA + Hono API
- Workers Static Assets, D1, Workers AI (JSON Mode)
- Google OAuth (authorization code)
- Shared Zod schema in `src/shared/`

Default model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (`AI_MODEL` in `wrangler.jsonc`).

## Layout

```
src/client/     React SPA
src/worker/     Hono API, OAuth, Workers AI
src/shared/     Zod form schema (client + worker)
migrations/     D1 SQL migrations
```

`wrangler.jsonc` and `.dev.vars` are local and gitignored. Do not commit them or copy secrets into the repo. The tracked template is `wrangler.jsonc.example`.

## Commands

```bash
npm run dev                 # http://localhost:5173
npm run build
npm run deploy              # build + wrangler deploy
npm run cf-typegen          # regenerate binding types after wrangler.jsonc changes
npm run db:migrate:local
npm run db:migrate:remote
```

Workers AI uses remote bindings during `npm run dev`. Stay logged in with Wrangler.

## Product flow

Sign in → prompt a form → refine in the builder → test (rows marked test) → publish `/f/<slug>` → results table and CSV. Form list is `/app`. Public submitters have no account. Owner APIs are scoped by `owner_id`.

## Testing

Do not open a local browser preview to test UI changes. Do not run `npm run preview` or drive the app in a browser. Verify with the typecheck/build (`npm run build`) and by reading the changed code.
