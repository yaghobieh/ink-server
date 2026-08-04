import type { HarborRequest } from '@forgedevstack/harbor';
import { APP_NAME, HEALTH_OK } from '../const/index.js';

export const getHealth = async (_req: HarborRequest) => ({
  status: HEALTH_OK,
  service: APP_NAME,
  sprint: 2,
  features: ['login', 'db', 'oauth-google', 'oauth-github', 'payments-ai'],
});
