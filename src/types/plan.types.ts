export type InkPlan = 'free' | 'pro' | 'ai';

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
