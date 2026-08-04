import type { FastifyReply, FastifyRequest } from 'fastify';
import { getUsageForUser, recordTokenUsage } from '../repositories/usage.repository.js';
import { findUserByEmail } from '../services/auth.service.js';
import { getAuthUser } from '../plugins/auth.plugin.js';
import { insertAuditLog } from '../repositories/audit.repository.js';

export const getUsage = async (request: FastifyRequest, reply: FastifyReply) => {
  const auth = getAuthUser(request);
  if (!auth?.email) return reply.code(401).send({ error: 'unauthorized' });
  const user = await findUserByEmail(auth.email);
  if (!user) return reply.code(404).send({ error: 'not found' });
  const usage = await getUsageForUser(user.id, user.plan);
  return reply.send(usage);
};

export const postUsage = async (request: FastifyRequest, reply: FastifyReply) => {
  const auth = getAuthUser(request);
  if (!auth?.email) return reply.code(401).send({ error: 'unauthorized' });
  const user = await findUserByEmail(auth.email);
  if (!user) return reply.code(404).send({ error: 'not found' });

  const body = (request.body ?? {}) as Record<string, unknown>;
  const tokens = typeof body.tokens === 'number' ? body.tokens : 0;
  if (tokens <= 0) return reply.code(400).send({ error: 'tokens must be a positive number' });

  const usage = await recordTokenUsage(user.id, tokens);
  await insertAuditLog({
    userId: user.id,
    action: 'usage.record',
    resource: 'token_usage',
    metadata: { tokens },
    ipAddress: request.ip ?? null,
  });
  return reply.send(usage);
};
