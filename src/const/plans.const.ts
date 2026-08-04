import { AI_PLAN_MONTHLY_TOKEN_LIMIT } from './numbers.const.js';
import type { InkPlan } from '../types/plan.types.js';

export const INK_PLANS: InkPlan[] = ['free', 'pro', 'ai'];

export const PLAN_LICENSE_FEATURES: Record<InkPlan, string[]> = {
  free: [],
  pro: ['theme', 'icons', 'richPaste', 'imageUpload', 'wysiwyg', 'byoAi'],
  ai: ['theme', 'icons', 'richPaste', 'imageUpload', 'wysiwyg', 'byoAi', 'builtInAi'],
};

export const PLAN_MONTHLY_TOKEN_LIMIT: Record<InkPlan, number> = {
  free: 0,
  pro: 0,
  ai: AI_PLAN_MONTHLY_TOKEN_LIMIT,
};

export const PLAN_INCLUDES_BUILTIN_AI: Record<InkPlan, boolean> = {
  free: false,
  pro: false,
  ai: true,
};

export const isPremiumPlan = (plan: InkPlan): boolean => plan === 'pro' || plan === 'ai';
