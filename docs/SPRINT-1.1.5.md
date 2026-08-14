# Sprint 1.1.5 — Auth / CMS / Tokens

Tracks Jira INK-34 / INK-38 / INK-39 / INK-40.

## Scope
- Neon Postgres via DATABASE_URL (env only)
- GitHub + Gmail OAuth
- Admin roles + seed CMS admin
- Site token usage metering
- Cloudinary media
- Migrate portal content into API

## Local
1. Copy `.env.example` → `.env` (never commit `.env`)
2. Set DATABASE_URL, OAuth, Cloudinary, seed admin
3. `npm run dev`

PRs target `release/1.1.5`.
