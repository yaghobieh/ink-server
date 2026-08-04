import type { InkPlan } from './plan.types.js';

export type UserRole = 'user' | 'admin';

export type InkUserRecord = {
  id: string;
  email: string;
  name: string;
  passwordHash?: string | null;
  role: UserRole;
  plan: InkPlan;
  provider: string;
  providerId?: string | null;
  createdAt: string;
};

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  plan: InkPlan;
  premium: boolean;
};

export type AuthTokenPayload = {
  userId: string;
  email: string;
  role: UserRole;
};
