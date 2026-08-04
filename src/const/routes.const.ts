export const API = {
  HEALTH: '/api/health',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_ME: '/api/auth/me',
  AUTH_GOOGLE: '/api/auth/google',
  AUTH_GITHUB: '/api/auth/github',
  AUTH_GOOGLE_CALLBACK: '/api/auth/google/callback',
  AUTH_GITHUB_CALLBACK: '/api/auth/github/callback',
  ENTITLEMENTS: '/api/entitlements',
  USAGE: '/api/usage',
  AUDIT_LOGS: '/api/audit-logs',
  PAYMENTS_AI: '/api/payments/ai/advise',
} as const;
