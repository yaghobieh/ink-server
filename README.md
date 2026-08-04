# ink-server

Sprint 2 backend for Ink — Harbor + MongoDB.

## Scope

- Login / register (password)
- Google + GitHub OAuth start URLs (callback stub until secrets are set)
- Entitlements (`premium` flag)
- Payments AI advisor for IL / international sellers
- Deployable on Vercel alongside [ink-portal](https://github.com/yaghobieh/ink-portal)

## Develop

```bash
cp .env.example .env
# start MongoDB locally or Atlas URI
npm install
npm run dev
```

Health: `GET /api/health`

## Auth

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/auth/register` | `{ email, name, password }` |
| POST | `/api/auth/login` | `{ email, password }` → JWT |
| GET | `/api/auth/me` | needs JWT wiring (Sprint 2 middleware) |
| GET | `/api/auth/google` | OAuth start |
| GET | `/api/auth/github` | OAuth start |

## Payments AI

`POST /api/payments/ai/advise` with `{ country: "IL" }` returns recommended rails for Israeli sellers.

## Deploy (Vercel BE + FE)

1. **Portal (FE):** Vercel project → root `ink-portal`, deploy **only** `main`/`master` (ignoreCommand skips feature branches).
2. **API (BE):** Vercel project → root `ink-server`, Node runtime, env: `MONGODB_URI`, `JWT_SECRET`, OAuth secrets, `CORS_ORIGIN=https://inkforgejs.com`.
3. Point portal `VITE_INK_API_URL` at the BE deployment URL.

Release flow: merge `release/*` → `main` to ship FE; same for BE when API is ready.
