export type InkPlan = 'free' | 'pro' | 'ai';

export type PlanAiMode = 'none' | 'byo' | 'builtIn';

export type PlanCapability = {
  plan: InkPlan;
  portalTier: string;
  aiMode: PlanAiMode;
  monthlyTokenLimit: number;
  licenseFeatures: string[];
  manageByRoles: string[];
  sitesLimit: number;
};

export type EntitlementsResponse = {
  plan: InkPlan;
  premium: boolean;
  licenseFeatures: string[];
  aiIncluded: boolean;
  monthlyTokenLimit: number;
};

export type UsageResponse = {
  tokensUsed: number;
  tokensLimit: number;
  periodStart: string;
  periodEnd: string;
};
