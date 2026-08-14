import type { FastifyInstance } from 'fastify';
import { API } from '../const/index.js';
import { authenticate } from '../plugins/auth.plugin.js';
import {
  completeAi,
  getAuditLogs,
  getCmsContent,
  getCmsContentByCollection,
  getCmsDashboard,
  getCmsMedia,
  getCmsMediaSign,
  getCmsPages,
  getCmsPlans,
  getEntitlements,
  getHealth,
  getPublicDocBySlug,
  getPublicDocs,
  getUsage,
  patchCmsPlan,
  postCmsContent,
  postCmsMedia,
  postCmsPage,
  postUsage,
  putCmsPage,
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

  app.get(API.PUBLIC_DOCS, getPublicDocs);
  app.get(API.PUBLIC_DOCS_SLUG, getPublicDocBySlug);

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

  app.get(API.CMS_DASHBOARD, { preHandler: authenticate }, getCmsDashboard);
  app.get(API.CMS_PAGES, { preHandler: authenticate }, getCmsPages);
  app.post(API.CMS_PAGES, { preHandler: authenticate }, postCmsPage);
  app.put(API.CMS_PAGE, { preHandler: authenticate }, putCmsPage);
  app.get(API.CMS_CONTENT, { preHandler: authenticate }, getCmsContent);
  app.get(API.CMS_CONTENT_COLLECTION, { preHandler: authenticate }, getCmsContentByCollection);
  app.post(API.CMS_CONTENT, { preHandler: authenticate }, postCmsContent);
  app.get(API.CMS_MEDIA, { preHandler: authenticate }, getCmsMedia);
  app.get(API.CMS_MEDIA_SIGN, { preHandler: authenticate }, getCmsMediaSign);
  app.post(API.CMS_MEDIA, { preHandler: authenticate }, postCmsMedia);
  app.get(API.CMS_PLANS, { preHandler: authenticate }, getCmsPlans);
  app.patch(API.CMS_PLANS, { preHandler: authenticate }, patchCmsPlan);

  app.post(API.PAYMENTS_AI, advisePayments);

  app.post(API.AI_COMPLETE, { preHandler: authenticate }, completeAi);
};
