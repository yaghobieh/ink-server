import {
  CREW_PLAN_AI,
  CREW_PLAN_FREE,
  CREW_PROVIDER_PASSWORD,
  CREW_ROLE_SLUGS,
  CREW_SYSTEM_ROLE_ADMIN,
  DEFAULT_CREW_ROLES,
} from '../const/crew.const.js';
import { getSql, firstRow } from '../db/index.js';
import type { CrewPermission, CrewRoleRecord, CrewUserRecord } from '../types/crew.types.js';
import type { UserRole } from '../types/user.types.js';

type RoleRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  permissions: unknown;
  system: boolean;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role_ids: string[] | null;
};

type SqlClient = (
  strings: TemplateStringsArray,
  ...values: readonly unknown[]
) => Promise<unknown>;

const parsePermissions = (value: unknown): CrewPermission[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is CrewPermission => typeof item === 'string');
};

const mapRole = (row: RoleRow): CrewRoleRecord => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  description: row.description,
  permissions: parsePermissions(row.permissions),
  system: row.system,
});

const mapUser = (row: UserRow): CrewUserRecord => ({
  id: row.id,
  name: row.name,
  email: row.email,
  username: row.username ?? '',
  roleIds: Array.isArray(row.role_ids) ? row.role_ids.filter(Boolean) : [],
  active: true,
});

export const ensureCrewTables = async (sql: SqlClient): Promise<void> => {
  await sql`
    CREATE TABLE IF NOT EXISTS cms_roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
      system BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS cms_user_roles (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id UUID NOT NULL REFERENCES cms_roles(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, role_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS cms_user_roles_role_id_idx ON cms_user_roles (role_id)`;

  for (const role of DEFAULT_CREW_ROLES) {
    const permissionsJson = JSON.stringify(role.permissions);
    await sql`
      INSERT INTO cms_roles (slug, name, description, permissions, system)
      VALUES (${role.slug}, ${role.name}, ${role.description}, ${permissionsJson}::jsonb, ${role.system})
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        permissions = EXCLUDED.permissions,
        system = EXCLUDED.system,
        updated_at = NOW()
    `;
  }
};

export const seedCrewTables = async (): Promise<void> => {
  await ensureCrewTables(getSql());
};

export const listCrewRoles = async (): Promise<CrewRoleRecord[]> => {
  const sql = getSql();
  const rows = await sql`
    SELECT id, slug, name, description, permissions, system
    FROM cms_roles
    ORDER BY system DESC, name ASC
  `;
  return (rows as RoleRow[]).map(mapRole);
};

export const findCrewRoleById = async (roleId: string): Promise<CrewRoleRecord | null> => {
  const sql = getSql();
  const rows = await sql`
    SELECT id, slug, name, description, permissions, system
    FROM cms_roles
    WHERE id = ${roleId}
    LIMIT 1
  `;
  const row = firstRow<RoleRow>(rows);
  return row ? mapRole(row) : null;
};

export const findCrewRoleBySlug = async (slug: string): Promise<CrewRoleRecord | null> => {
  const sql = getSql();
  const rows = await sql`
    SELECT id, slug, name, description, permissions, system
    FROM cms_roles
    WHERE slug = ${slug}
    LIMIT 1
  `;
  const row = firstRow<RoleRow>(rows);
  return row ? mapRole(row) : null;
};

export const createCrewRole = async (input: {
  slug: string;
  name: string;
  description: string;
  permissions: CrewPermission[];
}): Promise<CrewRoleRecord> => {
  const sql = getSql();
  const permissionsJson = JSON.stringify(input.permissions);
  const rows = await sql`
    INSERT INTO cms_roles (slug, name, description, permissions, system)
    VALUES (${input.slug}, ${input.name}, ${input.description}, ${permissionsJson}::jsonb, FALSE)
    RETURNING id, slug, name, description, permissions, system
  `;
  const row = firstRow<RoleRow>(rows);
  if (!row) throw new Error('failed to create role');
  return mapRole(row);
};

export const updateCrewRole = async (
  roleId: string,
  input: {
    name?: string;
    description?: string;
    permissions?: CrewPermission[];
  },
): Promise<CrewRoleRecord | null> => {
  const current = await findCrewRoleById(roleId);
  if (!current) return null;
  const name = input.name ?? current.name;
  const description = input.description ?? current.description;
  const permissions = input.permissions ?? current.permissions;
  const permissionsJson = JSON.stringify(permissions);
  const sql = getSql();
  const rows = await sql`
    UPDATE cms_roles
    SET name = ${name},
        description = ${description},
        permissions = ${permissionsJson}::jsonb,
        updated_at = NOW()
    WHERE id = ${roleId}
    RETURNING id, slug, name, description, permissions, system
  `;
  const row = firstRow<RoleRow>(rows);
  return row ? mapRole(row) : null;
};

export const listCrewUsers = async (): Promise<CrewUserRecord[]> => {
  const sql = getSql();
  const rows = await sql`
    SELECT
      u.id,
      u.name,
      u.email,
      u.username,
      COALESCE(
        ARRAY_AGG(ur.role_id::text) FILTER (WHERE ur.role_id IS NOT NULL),
        ARRAY[]::text[]
      ) AS role_ids
    FROM users u
    LEFT JOIN cms_user_roles ur ON ur.user_id = u.id
    GROUP BY u.id, u.name, u.email, u.username
    ORDER BY u.created_at DESC
  `;
  return (rows as UserRow[]).map(mapUser);
};

export const assignUserRole = async (userId: string, roleId: string): Promise<void> => {
  const sql = getSql();
  await sql`
    INSERT INTO cms_user_roles (user_id, role_id)
    VALUES (${userId}, ${roleId})
    ON CONFLICT (user_id, role_id) DO NOTHING
  `;
};

export const assignUserRoleOnClient = async (
  sql: SqlClient,
  userId: string,
  roleSlug: string,
): Promise<void> => {
  const rows = await sql`
    SELECT id FROM cms_roles WHERE slug = ${roleSlug} LIMIT 1
  `;
  const row = firstRow<{ id: string }>(rows);
  if (!row) return;
  await sql`
    INSERT INTO cms_user_roles (user_id, role_id)
    VALUES (${userId}, ${row.id})
    ON CONFLICT (user_id, role_id) DO NOTHING
  `;
};

export const upsertInstallAdmin = async (
  sql: SqlClient,
  input: {
    email: string;
    name: string;
    username: string;
    passwordHash: string;
  },
): Promise<string> => {
  const rows = await sql`
    INSERT INTO users (email, name, username, password_hash, provider, role)
    VALUES (
      ${input.email},
      ${input.name},
      ${input.username},
      ${input.passwordHash},
      ${CREW_PROVIDER_PASSWORD},
      ${CREW_SYSTEM_ROLE_ADMIN}
    )
    ON CONFLICT (email) DO UPDATE SET
      username = EXCLUDED.username,
      password_hash = EXCLUDED.password_hash,
      role = ${CREW_SYSTEM_ROLE_ADMIN},
      name = EXCLUDED.name,
      updated_at = NOW()
    RETURNING id
  `;
  const user = firstRow<{ id: string }>(rows);
  if (!user) throw new Error('failed to create first admin');
  await sql`
    INSERT INTO plans (user_id, plan)
    VALUES (${user.id}, ${CREW_PLAN_AI})
    ON CONFLICT (user_id) DO UPDATE SET plan = ${CREW_PLAN_AI}, updated_at = NOW()
  `;
  await assignUserRoleOnClient(sql, user.id, CREW_ROLE_SLUGS.CAPTAIN);
  return user.id;
};

export const systemRoleForCrewSlug = (slug: string): UserRole =>
  slug === CREW_ROLE_SLUGS.CAPTAIN ? CREW_SYSTEM_ROLE_ADMIN : 'user';

export { CREW_PLAN_FREE };
