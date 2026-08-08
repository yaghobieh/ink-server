import { AI_PLAN_MONTHLY_TOKEN_LIMIT } from './numbers.const.js';
import {
  LICENSE_FEATURE_BUILT_IN_AI,
  LICENSE_FEATURE_BYO_AI,
  LICENSE_FEATURE_ICONS,
  LICENSE_FEATURE_IMAGE_UPLOAD,
  LICENSE_FEATURE_RICH_PASTE,
  LICENSE_FEATURE_THEME,
  LICENSE_FEATURE_WYSIWYG,
  ROLE_ADMIN,
  ROLE_CRM_ADMIN,
} from './strings.const.js';
import type { InkPlan, PlanCapability } from '../types/plan.types.js';
import type { UserRole } from '../types/user.types.js';

export const INK_PLANS: InkPlan[] = ['free', 'pro', 'ai'];

export const PLAN_MANAGEMENT_OPTIONS: InkPlan[] = [...INK_PLANS];

export const PLAN_LICENSE_FEATURES: Record<InkPlan, string[]> = {
  free: [],
  pro: [
    LICENSE_FEATURE_THEME,
    LICENSE_FEATURE_ICONS,
    LICENSE_FEATURE_RICH_PASTE,
    LICENSE_FEATURE_IMAGE_UPLOAD,
    LICENSE_FEATURE_WYSIWYG,
    LICENSE_FEATURE_BYO_AI,
  ],
  ai: [
    LICENSE_FEATURE_THEME,
    LICENSE_FEATURE_ICONS,
    LICENSE_FEATURE_RICH_PASTE,
    LICENSE_FEATURE_IMAGE_UPLOAD,
    LICENSE_FEATURE_WYSIWYG,
    LICENSE_FEATURE_BYO_AI,
    LICENSE_FEATURE_BUILT_IN_AI,
  ],
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

export const PLAN_CAPABILITIES: Record<InkPlan, PlanCapability> = {
  free: {
    plan: 'free',
    portalTier: 'community',
    aiMode: 'none',
    monthlyTokenLimit: PLAN_MONTHLY_TOKEN_LIMIT.free,
    licenseFeatures: PLAN_LICENSE_FEATURES.free,
    manageByRoles: [ROLE_ADMIN, ROLE_CRM_ADMIN],
  },
  pro: {
    plan: 'pro',
    portalTier: 'premium',
    aiMode: 'byo',
    monthlyTokenLimit: PLAN_MONTHLY_TOKEN_LIMIT.pro,
    licenseFeatures: PLAN_LICENSE_FEATURES.pro,
    manageByRoles: [ROLE_ADMIN, ROLE_CRM_ADMIN],
  },
  ai: {
    plan: 'ai',
    portalTier: 'premium_ai',
    aiMode: 'builtIn',
    monthlyTokenLimit: PLAN_MONTHLY_TOKEN_LIMIT.ai,
    licenseFeatures: PLAN_LICENSE_FEATURES.ai,
    manageByRoles: [ROLE_ADMIN, ROLE_CRM_ADMIN],
  },
};

export const isPremiumPlan = (plan: InkPlan): boolean => plan === 'pro' || plan === 'ai';

export const planHasAiAccess = (plan: InkPlan): boolean => {
  const features = PLAN_LICENSE_FEATURES[plan];
  return (
    features.includes(LICENSE_FEATURE_BUILT_IN_AI) ||
    features.includes(LICENSE_FEATURE_BYO_AI)
  );
};

export const isCrmAdmin = (role: UserRole): boolean => role === ROLE_CRM_ADMIN;

export const canManagePlans = (role: UserRole): boolean =>
  role === ROLE_ADMIN || role === ROLE_CRM_ADMIN;
