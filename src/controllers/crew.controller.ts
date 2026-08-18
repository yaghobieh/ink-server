import { createHash } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { CONFIG } from '../const/index.js';
import { CREW_PERMISSIONS, CREW_PLAN_FREE, CREW_PROVIDER_PASSWORD } from '../const/crew.const.js';
import { getAuthUser } from '../plugins/auth.plugin.js';
import {
  assignUserRole,
  createCrewRole,
  findCrewRoleById,
  findCrewRoleBySlug,
  listCrewRoles,
  listCrewUsers,
  seedCrewTables,
  systemRoleForCrewSlug,
  updateCrewRole,
} from '../repositories/crew.repository.js';
import { createPasswordUser, findUserByEmail } from '../repositories/user.repository.js';
import type { CrewPermission } from '../types/crew.types.js';

const str = (value: unknown): string => (typeof value === 'string' ? value : '');

const hashPassword = (password: string): string =>
  createHash('sha256').update(`${CONFIG.JWT_SECRET}:${password}`).digest('hex');

const slugFromName = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const parsePermissions = (value: unknown): CrewPermission[] | null => {
  if (!Array.isArray(value)) return null;
  const allowed = new Set<string>(CREW_PERMISSIONS);
  const next = value.filter((item): item is CrewPermission => typeof item === 'string' && allowed.has(item));
  return next.length > 0 ? next : null;
};

const requireAuthUser = async (request: FastifyRequest, reply: FastifyReply) => {
  const auth = getAuthUser(request);
  if (!auth?.email) {
    reply.code(401).send({ error: 'unauthorized' });
    return null;
  }
  const user = await findUserByEmail(auth.email);
  if (!user) {
    reply.code(404).send({ error: 'not found' });
    return null;
  }
  return user;
};

export const getCmsRoles = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!(await requireAuthUser(request, reply))) return;
  await seedCrewTables();
  const roles = await listCrewRoles();
  return reply.send({ roles });
};

export const postCmsRole = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!(await requireAuthUser(request, reply))) return;
  await seedCrewTables();
  const body = (request.body ?? {}) as Record<string, unknown>;
  const name = str(body.name);
  const description = str(body.description);
  const permissions = parsePermissions(body.permissions);
  if (!name || !permissions) {
    return reply.code(400).send({ error: 'name and permissions required' });
  }
  const slug = slugFromName(str(body.slug) || name);
  if (!slug) return reply.code(400).send({ error: 'slug required' });
  const existing = await findCrewRoleBySlug(slug);
  if (existing) return reply.code(409).send({ error: 'role already exists' });
  const role = await createCrewRole({ slug, name, description, permissions });
  return reply.send({ role });
};

export const patchCmsRole = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!(await requireAuthUser(request, reply))) return;
  const params = request.params as Record<string, unknown>;
  const roleId = str(params.id);
  if (!roleId) return reply.code(400).send({ error: 'id required' });
  const body = (request.body ?? {}) as Record<string, unknown>;
  const permissions = body.permissions === undefined ? undefined : parsePermissions(body.permissions);
  if (body.permissions !== undefined && !permissions) {
    return reply.code(400).send({ error: 'permissions required' });
  }
  const role = await updateCrewRole(roleId, {
    name: body.name === undefined ? undefined : str(body.name),
    description: body.description === undefined ? undefined : str(body.description),
    permissions: permissions ?? undefined,
  });
  if (!role) return reply.code(404).send({ error: 'not found' });
  return reply.send({ role });
};

export const getCmsUsers = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!(await requireAuthUser(request, reply))) return;
  await seedCrewTables();
  const users = await listCrewUsers();
  return reply.send({ users });
};

export const postCmsUser = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!(await requireAuthUser(request, reply))) return;
  await seedCrewTables();
  const body = (request.body ?? {}) as Record<string, unknown>;
  const email = str(body.email);
  const name = str(body.name);
  const username = str(body.username);
  const password = str(body.password);
  const roleId = str(body.roleId);
  if (!email || !name || !username || !password || !roleId) {
    return reply.code(400).send({ error: 'name, email, username, password, roleId required' });
  }
  const existing = await findUserByEmail(email);
  if (existing) return reply.code(409).send({ error: 'email already registered' });
  const role = await findCrewRoleById(roleId);
  if (!role) return reply.code(404).send({ error: 'role not found' });
  const user = await createPasswordUser({
    email,
    name,
    username,
    passwordHash: hashPassword(password),
    role: systemRoleForCrewSlug(role.slug),
    plan: CREW_PLAN_FREE,
    provider: CREW_PROVIDER_PASSWORD,
  });
  await assignUserRole(user.id, role.id);
  return reply.send({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username ?? username,
      roleIds: [role.id],
      active: true,
    },
  });
};
