import { createHash } from 'node:crypto';
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL ?? '';
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-change-me';
const USERNAME = process.env.SEED_ADMIN_USERNAME ?? 'yaghobieh';
const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
const EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'yaghobieh@ink.local';
const NAME = process.env.SEED_ADMIN_NAME ?? 'Yaghobieh';

const hashPassword = (password: string): string =>
  createHash('sha256').update(`${JWT_SECRET}:${password}`).digest('hex');

const run = async () => {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const sql = neon(DATABASE_URL);

  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT,
      provider TEXT NOT NULL DEFAULT 'password',
      provider_id TEXT,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'crm_admin')),
      username TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique_idx
    ON users (username)
    WHERE username IS NOT NULL
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'ai')),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS token_usage (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tokens_used INTEGER NOT NULL DEFAULT 0,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, period_start)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      resource TEXT,
      metadata JSONB NOT NULL DEFAULT '{}',
      ip_address TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const passwordHash = hashPassword(PASSWORD);

  const rows = await sql`
    INSERT INTO users (email, name, username, password_hash, provider, role)
    VALUES (${EMAIL}, ${NAME}, ${USERNAME}, ${passwordHash}, 'password', 'admin')
    ON CONFLICT (email) DO UPDATE SET
      username = EXCLUDED.username,
      password_hash = EXCLUDED.password_hash,
      role = 'admin',
      name = EXCLUDED.name,
      updated_at = NOW()
    RETURNING id, email, username, role
  `;

  const user = Array.isArray(rows) ? rows[0] : null;
  if (!user || typeof user !== 'object' || !('id' in user)) {
    throw new Error('failed to seed admin user');
  }

  const userId = String((user as { id: string }).id);

  await sql`
    INSERT INTO plans (user_id, plan)
    VALUES (${userId}, 'ai')
    ON CONFLICT (user_id) DO UPDATE SET plan = 'ai', updated_at = NOW()
  `;

  console.log(`Seeded admin: ${USERNAME} / ${EMAIL} (${userId})`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
