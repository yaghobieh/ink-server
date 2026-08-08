import type { FastifyReply, FastifyRequest } from 'fastify';
import { CONFIG } from '../const/index.js';
import {
  AI_COMPLETE_STUB_TOKENS,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_NOT_IMPLEMENTED,
  HTTP_STATUS_UNAUTHORIZED,
} from '../const/numbers.const.js';
import {
  PLAN_INCLUDES_BUILTIN_AI,
  PLAN_LICENSE_FEATURES,
  planHasAiAccess,
} from '../const/plans.const.js';
import {
  AUDIT_ACTION_AI_COMPLETE,
  AUDIT_RESOURCE_AI,
  LICENSE_FEATURE_BUILT_IN_AI,
} from '../const/strings.const.js';
import { getAuthUser } from '../plugins/auth.plugin.js';
import { insertAuditLog } from '../repositories/audit.repository.js';
import { recordTokenUsage } from '../repositories/usage.repository.js';
import { findUserByEmail } from '../services/auth.service.js';

export const completeAi = async (request: FastifyRequest, reply: FastifyReply) => {
  const auth = getAuthUser(request);
  if (!auth?.email) {
    return reply.code(HTTP_STATUS_UNAUTHORIZED).send({ error: 'unauthorized' });
  }

  const user = await findUserByEmail(auth.email);
  if (!user) {
    return reply.code(HTTP_STATUS_NOT_FOUND).send({ error: 'not found' });
  }

  if (!planHasAiAccess(user.plan)) {
    return reply.code(HTTP_STATUS_FORBIDDEN).send({
      error: 'plan does not include AI access',
      plan: user.plan,
      licenseFeatures: PLAN_LICENSE_FEATURES[user.plan],
    });
  }

  const body = (request.body ?? {}) as Record<string, unknown>;
  const prompt = typeof body.prompt === 'string' ? body.prompt : '';
  if (!prompt) {
    return reply.code(HTTP_STATUS_BAD_REQUEST).send({ error: 'prompt required' });
  }

  const usage = await recordTokenUsage(user.id, AI_COMPLETE_STUB_TOKENS);
  await insertAuditLog({
    userId: user.id,
    action: AUDIT_ACTION_AI_COMPLETE,
    resource: AUDIT_RESOURCE_AI,
    metadata: {
      plan: user.plan,
      builtInAi: PLAN_INCLUDES_BUILTIN_AI[user.plan],
      hasBuiltInFeature: PLAN_LICENSE_FEATURES[user.plan].includes(LICENSE_FEATURE_BUILT_IN_AI),
      tokens: AI_COMPLETE_STUB_TOKENS,
    },
    ipAddress: request.ip ?? null,
  });

  if (!CONFIG.OPENAI_API_KEY) {
    return reply.code(HTTP_STATUS_NOT_IMPLEMENTED).send({
      error: 'AI completion not configured',
      stub: true,
      usage,
    });
  }

  return reply.code(HTTP_STATUS_NOT_IMPLEMENTED).send({
    error: 'AI completion not implemented',
    stub: true,
    usage,
  });
};
