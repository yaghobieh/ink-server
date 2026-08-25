import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  PLAN_CAPABILITIES,
  PLAN_LICENSE_FEATURES,
  PLAN_MONTHLY_TOKEN_LIMIT,
  PLAN_SITES_LIMIT,
} from '../const/plans.const.js';
import { getAuthUser } from '../plugins/auth.plugin.js';
import { listContent } from '../repositories/content.repository.js';
import { findUserByEmail } from '../services/auth.service.js';
import {
  buildEntitlements,
  parsePlan,
  updateUserPlan,
} from '../services/entitlements.service.js';
import { toPublicUser } from '../utils/user.utils.js';
import type { InkPlan } from '../types/plan.types.js';

const PRICE: Record<InkPlan, { amount: number; period: string; label: string }> = {
  free: { amount: 0, period: 'forever', label: '$0' },
  pro: { amount: 29, period: 'once', label: '$29' },
  ai: { amount: 19, period: 'month', label: '$19' },
};

export const getCmsPlans = async (request: FastifyRequest, reply: FastifyReply) => {
  const auth = getAuthUser(request);
  if (!auth?.email) return reply.code(401).send({ error: 'unauthorized' });
  const user = await findUserByEmail(auth.email);
  if (!user) return reply.code(404).send({ error: 'not found' });

  const stored = await listContent('plans');
  const plans = (['free', 'pro', 'ai'] as InkPlan[]).map((plan) => {
    const fromDb = stored.find((item) => item.slug === plan);
    const capability = PLAN_CAPABILITIES[plan];
    return {
      id: plan,
      title: fromDb?.title ?? plan.toUpperCase(),
      portalTier: capability.portalTier,
      aiMode: capability.aiMode,
      monthlyTokenLimit: PLAN_MONTHLY_TOKEN_LIMIT[plan],
      sitesLimit: PLAN_SITES_LIMIT[plan],
      licenseFeatures: PLAN_LICENSE_FEATURES[plan],
      price: PRICE[plan],
      payload: fromDb?.payload ?? {},
      status: fromDb?.status ?? 'published',
    };
  });

  return reply.send({
    plans,
    activeUserPlan: user.plan,
  });
};

export const patchCmsPlan = async (request: FastifyRequest, reply: FastifyReply) => {
  const auth = getAuthUser(request);
  if (!auth?.email) return reply.code(401).send({ error: 'unauthorized' });
  const user = await findUserByEmail(auth.email);
  if (!user) return reply.code(404).send({ error: 'not found' });

  const body = (request.body ?? {}) as Record<string, unknown>;
  const plan = parsePlan(body.plan);
  if (!plan) return reply.code(400).send({ error: 'plan required' });

  await updateUserPlan(user.id, plan);
  const updated = await findUserByEmail(auth.email);
  if (!updated) return reply.code(404).send({ error: 'not found' });

  return reply.send({
    ok: true,
    activeUserPlan: updated.plan,
    user: toPublicUser(updated),
    entitlements: buildEntitlements(updated),
  });
};
