# AI credit pool (enterprise model)

Do **not** put Neon credentials in this file. Use local `DATABASE_URL` only.

## Units

| Layer | Unit | Meaning |
|-------|------|---------|
| Provider | OpenAI tokens | What we pay (prompt + completion) |
| Product | **Ink credits** | Internal currency sold to customers |
| Company pool | Monthly credits | Cap for all paid sites (e.g. 2_000_000) |

**Rule of thumb:** 1 Ink credit ≈ 1 provider token × markup (start **2×**). Adjust after real usage.

## Why not “2000 tokens” literally

OpenAI burns thousands of tokens per AI chat turn. A customer-facing allotment of **2000** is too small for product AI. Prefer:

| Plan | Monthly Ink credits | Notes |
|------|---------------------|--------|
| Free | 0 hosted AI | BYO key only |
| Pro | 50_000 | Solo / small site |
| Business | 250_000 | Multi-site |
| Captain / Top | 500_000+ | Your account — full CMS + metering |

Company pool (e.g. 2M) is the **ceiling** across all paying sites for the month.

## Binding (paid editor)

```
InkEditor
  premium={{ licenseKey }}
  siteId="site_…"
  siteToken="ink_site_…"
```

Server resolves: `site_token` → `site_id` → plan allotment → remaining credits → allowed features.

## Schema (target)

- `sites` — customer sites
- `site_tokens` — opaque tokens, scopes, revoked_at
- `credit_pools` — company monthly pool
- `credit_allotments` — per site/user/plan period
- `usage_events` — request_id, site_id, user_id, credits, provider_tokens, model
- `usage_daily` — rollups for dashboards

## Metering API

`GET /api/usage` → `{ used, remaining, max, requests, period }`

Captain dashboard shows used / remaining / requests for top plan.

## Big-company future

1. Multi-region Neon + read replicas  
2. Soft/hard credit limits + overage packs  
3. MoR billing (Paddle) settles plan → allotment webhook  
4. Per-tenant isolation (org_id on every row)  
5. Cost anomaly alerts (provider spend vs credits sold)

## Cursor DB

Add Neon as a Cursor Postgres connection profile using **local** `DATABASE_URL` from `ink-server/.env` (never commit). Rotate password after any chat paste.
