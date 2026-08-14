import type { FastifyReply, FastifyRequest } from 'fastify';
import { DEFAULT_AUDIT_LOG_LIMIT, MAX_AUDIT_LOG_LIMIT } from '../const/numbers.const.js';
import { canManagePlans } from '../const/plans.const.js';
import { listAuditLogs } from '../repositories/audit.repository.js';
import { getAuthUser } from '../plugins/auth.plugin.js';

const parseLimit = (value: unknown): number => {
  const parsed = typeof value === 'string' ? Number(value) : DEFAULT_AUDIT_LOG_LIMIT;
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_AUDIT_LOG_LIMIT;
  return Math.min(Math.floor(parsed), MAX_AUDIT_LOG_LIMIT);
};

const parseOffset = (value: unknown): number => {
  const parsed = typeof value === 'string' ? Number(value) : 0;
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
};

export const getAuditLogs = async (request: FastifyRequest, reply: FastifyReply) => {
  const auth = getAuthUser(request);
  if (!auth?.userId) return reply.code(401).send({ error: 'unauthorized' });

  const query = request.query as Record<string, unknown>;
  const scopeAll = query.scope === 'all' && canManagePlans(auth.role);
  const limit = parseLimit(query.limit);
  const offset = parseOffset(query.offset);

  const result = await listAuditLogs({
    userId: scopeAll ? null : auth.userId,
    limit,
    offset,
  });

  return reply.send(result);
};
