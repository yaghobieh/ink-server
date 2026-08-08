import { APP_NAME, HEALTH_OK } from '../const/index.js';
import { pingDatabase } from '../db/index.js';

export const getHealth = async () => {
  let db = false;
  try {
    db = await pingDatabase();
  } catch {
    db = false;
  }
  return {
    status: HEALTH_OK,
    service: APP_NAME,
    sprint: 2,
    db,
    features: [
      'login',
      'register',
      'oauth-google',
      'oauth-github',
      'entitlements',
      'usage',
      'audit-logs',
      'payments-ai',
    ],
  };
};
