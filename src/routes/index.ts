import type { FastifyInstance } from 'fastify';
import { API } from '../const/index.js';
import { authenticate } from '../plugins/auth.plugin.js';
import {
  completeAi,
  getAuditLogs,
  getEntitlements,
  getHealth,
  getUsage,
  postUsage,
  setEntitlements,
} from '../controllers/index.js';
import {
  githubCallback,
  googleCallback,
  login,
  me,
  register,
  startGithubOAuth,
  startGoogleOAuth,
} from '../controllers/auth.controller.js';
import { advisePayments } from '../controllers/payments.controller.js';

export const registerRoutes = (app: FastifyInstance): void => {
  app.get(API.HEALTH, getHealth);

  app.post(API.AUTH_REGISTER, register);
  app.post(API.AUTH_LOGIN, login);
  app.get(API.AUTH_GOOGLE, startGoogleOAuth);
  app.get(API.AUTH_GITHUB, startGithubOAuth);
  app.get(API.AUTH_GOOGLE_CALLBACK, googleCallback);
  app.get(API.AUTH_GITHUB_CALLBACK, githubCallback);

  app.get(API.AUTH_ME, { preHandler: authenticate }, me);

  app.get(API.ENTITLEMENTS, { preHandler: authenticate }, getEntitlements);
  app.post(API.ENTITLEMENTS, { preHandler: authenticate }, setEntitlements);

  app.get(API.USAGE, { preHandler: authenticate }, getUsage);
  app.post(API.USAGE, { preHandler: authenticate }, postUsage);

  app.get(API.AUDIT_LOGS, { preHandler: authenticate }, getAuditLogs);

  app.post(API.PAYMENTS_AI, advisePayments);

  app.post(API.AI_COMPLETE, { preHandler: authenticate }, completeAi);
};
