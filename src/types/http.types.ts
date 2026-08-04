import type { HarborRequest } from '@forgedevstack/harbor';

export type InkRequest = HarborRequest & {
  user?: { userId?: string; email?: string; role?: string };
};

export type InkUserRecord = {
  _id: unknown;
  email: string;
  name: string;
  passwordHash?: string;
  role?: string;
  premium?: boolean;
  provider?: string;
  providerId?: string;
};
