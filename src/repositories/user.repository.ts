import { createHash } from 'node:crypto';
import { getSql, firstRow } from '../db/index.js';
import type { InkPlan } from '../types/plan.types.js';
import type { InkUserRecord, UserRole } from '../types/user.types.js';

type UserRow = {
  id: string;
  email: string;
  name: string;
  username: string | null;
  password_hash: string | null;
  role: UserRole;
  plan: InkPlan;
  provider: string;
  provider_id: string | null;
  created_at: string | Date;
};

const mapUser = (row: UserRow): InkUserRecord => ({
  id: row.id,
  email: row.email,
  name: row.name,
  username: row.username,
  passwordHash: row.password_hash,
  role: row.role,
  plan: row.plan,
  provider: row.provider,
  providerId: row.provider_id,
  createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
});

export const findUserByEmail = async (email: string): Promise<InkUserRecord | null> => {
  const sql = getSql();
  const rows = await sql`
    SELECT u.id, u.email, u.name, u.username, u.password_hash, u.role, u.provider, u.provider_id, u.created_at,
           COALESCE(p.plan, 'free') AS plan
    FROM users u
    LEFT JOIN plans p ON p.user_id = u.id
    WHERE u.email = ${email}
    LIMIT 1
  `;
  const row = firstRow<UserRow>(rows);
  return row ? mapUser(row) : null;
};

export const findUserByUsernameOrEmail = async (
  identity: string,
): Promise<InkUserRecord | null> => {
  const sql = getSql();
  const rows = await sql`
    SELECT u.id, u.email, u.name, u.username, u.password_hash, u.role, u.provider, u.provider_id, u.created_at,
           COALESCE(p.plan, 'free') AS plan
    FROM users u
    LEFT JOIN plans p ON p.user_id = u.id
    WHERE u.email = ${identity} OR u.username = ${identity}
    LIMIT 1
  `;
  const row = firstRow<UserRow>(rows);
  return row ? mapUser(row) : null;
};

export const findUserById = async (userId: string): Promise<InkUserRecord | null> => {
  const sql = getSql();
  const rows = await sql`
    SELECT u.id, u.email, u.name, u.username, u.password_hash, u.role, u.provider, u.provider_id, u.created_at,
           COALESCE(p.plan, 'free') AS plan
    FROM users u
    LEFT JOIN plans p ON p.user_id = u.id
    WHERE u.id = ${userId}
    LIMIT 1
  `;
  const row = firstRow<UserRow>(rows);
  return row ? mapUser(row) : null;
};

export const findUserByProvider = async (
  provider: string,
  providerId: string,
): Promise<InkUserRecord | null> => {
  const sql = getSql();
  const rows = await sql`
    SELECT u.id, u.email, u.name, u.username, u.password_hash, u.role, u.provider, u.provider_id, u.created_at,
           COALESCE(p.plan, 'free') AS plan
    FROM users u
    LEFT JOIN plans p ON p.user_id = u.id
    WHERE u.provider = ${provider} AND u.provider_id = ${providerId}
    LIMIT 1
  `;
  const row = firstRow<UserRow>(rows);
  return row ? mapUser(row) : null;
};

export const createPasswordUser = async (input: {
  email: string;
  name: string;
  passwordHash: string;
  username?: string;
  role?: UserRole;
  plan?: InkPlan;
  provider?: string;
}): Promise<InkUserRecord> => {
  const sql = getSql();
  const username = input.username ?? null;
  const role = input.role ?? 'user';
  const plan = input.plan ?? 'free';
  const provider = input.provider ?? 'password';
  const rows = await sql`
    INSERT INTO users (email, name, username, password_hash, provider, role)
    VALUES (${input.email}, ${input.name}, ${username}, ${input.passwordHash}, ${provider}, ${role})
    RETURNING id, email, name, username, password_hash, role, provider, provider_id, created_at
  `;
  const userRow = firstRow<Omit<UserRow, 'plan'>>(rows);
  if (!userRow) {
    throw new Error('failed to create user');
  }
  await sql`
    INSERT INTO plans (user_id, plan)
    VALUES (${userRow.id}, ${plan})
  `;
  return mapUser({ ...userRow, plan });
};

export const createOAuthUser = async (input: {
  email: string;
  name: string;
  provider: string;
  providerId: string;
}): Promise<InkUserRecord> => {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO users (email, name, provider, provider_id)
    VALUES (${input.email}, ${input.name}, ${input.provider}, ${input.providerId})
    RETURNING id, email, name, username, password_hash, role, provider, provider_id, created_at
  `;
  const userRow = firstRow<Omit<UserRow, 'plan'>>(rows);
  if (!userRow) {
    throw new Error('failed to create user');
  }
  await sql`
    INSERT INTO plans (user_id, plan)
    VALUES (${userRow.id}, 'free')
  `;
  return mapUser({ ...userRow, plan: 'free' });
};

export const linkOAuthProvider = async (
  userId: string,
  provider: string,
  providerId: string,
): Promise<void> => {
  const sql = getSql();
  await sql`
    UPDATE users
    SET provider = ${provider}, provider_id = ${providerId}, updated_at = NOW()
    WHERE id = ${userId}
  `;
};

export const setUserPlan = async (userId: string, plan: InkPlan): Promise<void> => {
  const sql = getSql();
  await sql`
    INSERT INTO plans (user_id, plan, updated_at)
    VALUES (${userId}, ${plan}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET plan = ${plan}, updated_at = NOW()
  `;
};

export const createSession = async (input: {
  userId: string;
  token: string;
  expiresAt: Date;
}): Promise<void> => {
  const sql = getSql();
  const tokenHash = createHash('sha256').update(input.token).digest('hex');
  await sql`
    INSERT INTO sessions (user_id, token_hash, expires_at)
    VALUES (${input.userId}, ${tokenHash}, ${input.expiresAt.toISOString()})
  `;
};
