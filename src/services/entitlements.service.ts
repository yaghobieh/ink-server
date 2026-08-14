import {
  INK_PLANS,
  PLAN_INCLUDES_BUILTIN_AI,
  PLAN_LICENSE_FEATURES,
  PLAN_MONTHLY_TOKEN_LIMIT,
  isPremiumPlan,
} from '../const/plans.const.js';
import { setUserPlan } from '../repositories/user.repository.js';
import type { InkPlan, EntitlementsResponse } from '../types/plan.types.js';
import type { InkUserRecord } from '../types/user.types.js';

export const buildEntitlements = (user: InkUserRecord): EntitlementsResponse => ({
  plan: user.plan,
  premium: isPremiumPlan(user.plan),
  licenseFeatures: PLAN_LICENSE_FEATURES[user.plan],
  aiIncluded: PLAN_INCLUDES_BUILTIN_AI[user.plan],
  monthlyTokenLimit: PLAN_MONTHLY_TOKEN_LIMIT[user.plan],
});

export const parsePlan = (value: unknown): InkPlan | null => {
  if (typeof value !== 'string') return null;
  return INK_PLANS.includes(value as InkPlan) ? (value as InkPlan) : null;
};

export const resolvePlanFromBody = (body: Record<string, unknown>): InkPlan | null => {
  const direct = parsePlan(body.plan);
  if (direct) return direct;
  if (typeof body.premium === 'boolean') {
    return body.premium ? 'pro' : 'free';
  }
  return null;
};

export const updateUserPlan = async (userId: string, plan: InkPlan): Promise<void> => {
  await setUserPlan(userId, plan);
};
