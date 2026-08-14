import type { FastifyReply, FastifyRequest } from 'fastify';
import { CONFIG } from '../const/index.js';
import {
  AI_COMPLETE_STUB_TOKENS,
  HTTP_STATUS_BAD_GATEWAY,
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
import { completeWithOpenAi } from '../services/openai.service.js';

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
  const capability = typeof body.capability === 'string' ? body.capability : 'chat';
  const html = typeof body.html === 'string' ? body.html : undefined;
  const selectionHtml = typeof body.selectionHtml === 'string' ? body.selectionHtml : undefined;
  const modelId = typeof body.modelId === 'string' ? body.modelId : undefined;

  if (!prompt && !html && !selectionHtml) {
    return reply.code(HTTP_STATUS_BAD_REQUEST).send({ error: 'prompt required' });
  }

  if (!CONFIG.OPENAI_API_KEY) {
    return reply.code(HTTP_STATUS_NOT_IMPLEMENTED).send({
      error: 'AI completion not configured',
      stub: true,
    });
  }

  try {
    const result = await completeWithOpenAi({
      prompt,
      capability,
      html,
      selectionHtml,
      modelId,
    });
    const tokens = result.tokens > 0 ? result.tokens : AI_COMPLETE_STUB_TOKENS;
    const usage = await recordTokenUsage(user.id, tokens);
    await insertAuditLog({
      userId: user.id,
      action: AUDIT_ACTION_AI_COMPLETE,
      resource: AUDIT_RESOURCE_AI,
      metadata: {
        plan: user.plan,
        builtInAi: PLAN_INCLUDES_BUILTIN_AI[user.plan],
        hasBuiltInFeature: PLAN_LICENSE_FEATURES[user.plan].includes(LICENSE_FEATURE_BUILT_IN_AI),
        tokens,
        model: result.model,
        capability,
      },
      ipAddress: request.ip ?? null,
    });

    return reply.send({
      text: result.text,
      html: result.html,
      meta: {
        provider: 'ink-server',
        model: result.model,
        tokens,
      },
      usage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OpenAI request failed';
    return reply.code(HTTP_STATUS_BAD_GATEWAY).send({ error: message });
  }
};
