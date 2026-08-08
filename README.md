# ink-server

Sprint 2 backend for Ink — **Fastify + Neon Postgres**.

## Scope

- Login / register (password) with JWT sessions
- Google + GitHub OAuth start URLs (callback stub until secrets are set)
- Plans: `free` | `pro` | `ai` (no AI / BYO AI / built-in AI with monthly tokens)
- Entitlements, token usage tracking, audit logs
- Payments AI advisor for IL / international sellers
- Deployable on Vercel alongside [ink-portal](https://github.com/yaghobieh/ink-portal)

## Develop

```bash
cp .env.example .env
# set DATABASE_URL to your Neon connection string
npm install
npm run db:init
npm run dev
```

Health: `GET /api/health`

## Environment

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon Postgres connection string |
| `JWT_SECRET` | Signs Bearer tokens |
| `CORS_ORIGIN` | Portal origin (e.g. `http://localhost:5173`) |
| `PORT` | Local port (default `4000`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth |
| `OAUTH_CALLBACK_BASE` | API base for OAuth redirects |
| `OPENAI_API_KEY` | Reserved for built-in AI (later) |

## Frontend ↔ Backend contract

**Portal env:** set `VITE_INK_API_URL` to the ink-server deployment URL (e.g. `http://localhost:4000` in dev).

**Authenticated calls:** send `Authorization: Bearer <token>` on every protected route. Token is returned from `POST /api/auth/login`, `POST /api/auth/register`, and OAuth callback stubs.

**Example (portal):**

```ts
const base = import.meta.env.VITE_INK_API_URL;
const res = await fetch(`${base}/api/entitlements`, {
  headers: { Authorization: `Bearer ${token}` },
});
const entitlements = await res.json();
```

## Plans

| Plan | Portal tier | AI | Monthly tokens |
|------|-------------|-----|----------------|
| `free` | Community | None | 0 |
| `pro` | Premium | BYO LLM | 0 |
| `ai` | Premium + Ink AI | Built-in | 100,000 |

## API

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/api/health` | — | `{ status, service, db, features }` |
| POST | `/api/auth/register` | — | `{ email, name, password }` → `{ user, token }` |
| POST | `/api/auth/login` | — | `{ email, password }` → `{ user, token }` |
| GET | `/api/auth/me` | Bearer | `{ user }` |
| GET | `/api/auth/google` | — | OAuth start `{ url, state, stub }` |
| GET | `/api/auth/github` | — | OAuth start |
| GET | `/api/auth/google/callback` | — | Stub callback |
| GET | `/api/auth/github/callback` | — | Stub callback |
| GET | `/api/entitlements` | Bearer | `{ plan, premium, licenseFeatures, aiIncluded, monthlyTokenLimit }` |
| POST | `/api/entitlements` | Bearer | `{ email, plan }` or `{ email, premium }` (admin tooling) |
| GET | `/api/usage` | Bearer | `{ tokensUsed, tokensLimit, periodStart, periodEnd }` |
| POST | `/api/usage` | Bearer | `{ tokens }` increment usage |
| GET | `/api/audit-logs` | Bearer | `{ items, total }`; `?scope=all` for admins |
| POST | `/api/payments/ai/advise` | — | `{ country: "IL" }` payment rails advice |

### User shape (JSON)

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User",
  "plan": "free",
  "premium": false
}
```

## Database

Schema: `sql/001_init.sql` — tables `users`, `sessions`, `plans`, `token_usage`, `audit_logs`.

```bash
npm run db:init
```

## Deploy (Vercel BE + FE)

1. **Portal (FE):** Vercel project → root `ink-portal`, deploy **only** `main`/`master`.
2. **API (BE):** Vercel project → root `ink-server`, Node runtime. Env: `DATABASE_URL`, `JWT_SECRET`, OAuth secrets, `CORS_ORIGIN=https://inkforgejs.com`.
3. Point portal `VITE_INK_API_URL` at the BE deployment URL.

Release flow: merge `release/*` → `main` to ship FE; same for BE when API is ready.
