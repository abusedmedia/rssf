# RSSF — Prompt to Form

Open-source form builder on Cloudflare. Describe what you want to collect; Workers AI turns that into structured form JSON. Owners sign in with Google. Anyone with a published link can submit. Answers live in D1 (SQLite).

## Stack

| Piece | Cloudflare product |
| --- | --- |
| App + API | One Worker (React SPA + Hono) |
| Hosting | Workers Static Assets (`*.workers.dev`) |
| Database | D1 (SQLite) |
| LLM | Workers AI (JSON Mode) |
| Auth | Google OAuth (authorization code) |

Free-plan ceilings reset at 00:00 UTC. Workers AI includes 10,000 neurons/day; form generation uses `@cf/meta/llama-3.3-70b-instruct-fp8-fast` by default (override with the `AI_MODEL` var).

## Prerequisites

1. A [Cloudflare](https://dash.cloudflare.com/) account (Workers Free is enough)
2. Node.js 20+
3. A Google Cloud project with OAuth

### Google OAuth

1. Open [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → OAuth consent screen
2. User type **External**, publish status **Testing**, add your Google account as a test user
3. Create credentials → **OAuth client ID** → Application type **Web application**
4. Authorized redirect URIs:
   - Local: `http://localhost:5173/auth/callback`
   - After deploy: `https://<worker-name>.<subdomain>.workers.dev/auth/callback`
5. Scopes used by the app: `openid`, `email`, `profile`

Each clone of this repo is self-hosted: use your own OAuth client and your own D1 database.

## Setup

```bash
git clone <your-fork-or-this-repo> rssf
cd rssf
npm install   # also runs `wrangler types`
npx wrangler login
cp wrangler.jsonc.example wrangler.jsonc
```

`wrangler.jsonc` is local and gitignored. The repo only ships [`wrangler.jsonc.example`](wrangler.jsonc.example), which has a placeholder database id. Your real file stays on this machine, so later deploys keep using your account and database.

If `npx wrangler whoami` lists more than one account, set `account_id` in `wrangler.jsonc` to the account that should own the Worker. Omit it when you only have one account.

### Create D1

```bash
npx wrangler d1 create rssf
```

Copy the printed `database_id` into `wrangler.jsonc` under `d1_databases[0].database_id` (replace the placeholder zeros). Do not commit that file.

Apply migrations:

```bash
npm run db:migrate:local
npm run db:migrate:remote
```

### Secrets and local vars

Copy the example env file:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars`:

```
GOOGLE_CLIENT_ID=....apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=....
```

For production, set the secret (and optionally the client id as a var or secret):

```bash
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
```

`AI_MODEL` is already set in `wrangler.jsonc`. To use a cheaper JSON Mode model, change it to `@cf/meta/llama-3.1-8b-instruct`.

Enable a `workers.dev` subdomain in the Cloudflare dashboard if you have not already (Workers → your account → Settings).

## Develop

Workers AI runs remotely during local development, so stay logged in with Wrangler (`npx wrangler login`) before starting the app. To boot the UI without Cloudflare auth (AI calls will fail):

```bash
CLOUDFLARE_REMOTE_BINDINGS=false npm run dev
```

Normal development:

```bash
npm run dev
```

Open `http://localhost:5173`. Sign in with Google, create a form from a prompt, refine it, test, publish, and open `/f/<slug>`.

## Deploy

```bash
npm run deploy
```

Add the production callback URL to your Google OAuth client before signing in on `workers.dev`.

Regenerate binding types after changing `wrangler.jsonc`:

```bash
npm run cf-typegen
```

## Product flow

1. **Sign in** with Google
2. **Prompt** what you want to collect → draft form
3. **Refine** with another prompt in the builder
4. **Test** (rows marked as test)
5. **Publish** and share `/f/<slug>`
6. **Results** table with CSV download
7. **Form list** at `/app`

Public submitters do not need an account. Owner APIs are scoped by `owner_id` in D1. Public routes only return published forms by slug.

## Project layout

```
src/client/     React SPA
src/worker/     Hono API, OAuth, Workers AI
src/shared/     Zod form schema shared by client + worker
migrations/     D1 SQL migrations
```

## License

MIT — see [LICENSE](LICENSE).
