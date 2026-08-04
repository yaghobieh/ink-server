import type { FastifyReply, FastifyRequest } from 'fastify';
import { insertAuditLog } from '../repositories/audit.repository.js';
import { findUserByEmail } from '../services/auth.service.js';
import {
  buildEntitlements,
  resolvePlanFromBody,
  updateUserPlan,
} from '../services/entitlements.service.js';
import { getAuthUser } from '../plugins/auth.plugin.js';

export const getEntitlements = async (request: FastifyRequest, reply: FastifyReply) => {
  const auth = getAuthUser(request);
  if (!auth?.email) return reply.code(401).send({ error: 'unauthorized' });
  const user = await findUserByEmail(auth.email);
  if (!user) return reply.code(404).send({ error: 'not found' });
  return reply.send(buildEntitlements(user));
};

export const setEntitlements = async (request: FastifyRequest, reply: FastifyReply) => {
  const body = (request.body ?? {}) as Record<string, unknown>;
  const email = typeof body.email === 'string' ? body.email : '';
  if (!email) return reply.code(400).send({ error: 'email required' });
  const plan = resolvePlanFromBody(body);
  if (!plan) return reply.code(400).send({ error: 'plan or premium required' });

  const user = await findUserByEmail(email);
  if (!user) return reply.code(404).send({ error: 'not found' });

  await updateUserPlan(user.id, plan);
  await insertAuditLog({
    userId: user.id,
    action: 'entitlements.update',
    resource: 'plans',
    metadata: { plan },
    ipAddress: request.ip ?? null,
  });

  const updated = await findUserByEmail(email);
  if (!updated) return reply.code(404).send({ error: 'not found' });

  return reply.send({
    ok: true,
    email,
    plan,
    premium: plan === 'pro' || plan === 'ai',
    entitlements: buildEntitlements(updated),
  });
};
