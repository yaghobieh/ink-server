import type { FastifyInstance } from 'fastify';
import { API } from '../const/index.js';
import { authenticate } from '../plugins/auth.plugin.js';
import {
  deleteCmsRole,
  getCmsContent,
  getCmsContentByCollection,
  getCmsDashboard,
  getCmsMedia,
  getCmsMediaConfig,
  getCmsMediaSign,
  getCmsNotifications,
  getCmsPageContent,
  getCmsPages,
  getCmsPlans,
  getCmsRoles,
  getCmsUsers,
  patchCmsNotification,
  postCmsTaskNotify,
  patchCmsPlan,
  patchCmsRole,
  patchCmsUser,
  postCmsContent,
  postCmsMedia,
  postCmsMediaUpload,
  postCmsPage,
  postCmsRole,
  postCmsUser,
  putCmsMediaConfig,
  putCmsPage,
} from '../controllers/index.js';

export const registerCmsRoutes = (app: FastifyInstance): void => {
  app.get(API.CMS_DASHBOARD, { preHandler: authenticate }, getCmsDashboard);
  app.get(API.CMS_DASHBOARD_ALIAS, { preHandler: authenticate }, getCmsDashboard);
  app.get(API.CMS_PAGES, { preHandler: authenticate }, getCmsPages);
  app.get(API.CMS_PAGE_CONTENT, { preHandler: authenticate }, getCmsPageContent);
  app.get(API.CMS_PAGE, { preHandler: authenticate }, getCmsPageContent);
  app.post(API.CMS_PAGES, { preHandler: authenticate }, postCmsPage);
  app.post(API.CMS_PAGE_CREATE, { preHandler: authenticate }, postCmsPage);
  app.put(API.CMS_PAGE, { preHandler: authenticate }, putCmsPage);
  app.put(API.CMS_PAGE_UPDATE, { preHandler: authenticate }, putCmsPage);
  app.get(API.CMS_CONTENT, { preHandler: authenticate }, getCmsContent);
  app.get(API.CMS_CONTENT_ALIAS, { preHandler: authenticate }, getCmsContent);
  app.get(API.CMS_CONTENT_COLLECTION, { preHandler: authenticate }, getCmsContentByCollection);
  app.get(API.CMS_CONTENT_COLLECTION_ALIAS, { preHandler: authenticate }, getCmsContentByCollection);
  app.post(API.CMS_CONTENT, { preHandler: authenticate }, postCmsContent);
  app.post(API.CMS_CONTENT_ALIAS, { preHandler: authenticate }, postCmsContent);
  app.get(API.CMS_MEDIA, { preHandler: authenticate }, getCmsMedia);
  app.get(API.CMS_MEDIA_SIGN, { preHandler: authenticate }, getCmsMediaSign);
  app.get(API.CMS_MEDIA_CONFIG, { preHandler: authenticate }, getCmsMediaConfig);
  app.put(API.CMS_MEDIA_CONFIG, { preHandler: authenticate }, putCmsMediaConfig);
  app.post(API.CMS_MEDIA, { preHandler: authenticate }, postCmsMedia);
  app.post(API.CMS_MEDIA_UPLOAD, { preHandler: authenticate }, postCmsMediaUpload);
  app.get(API.CMS_PLANS, { preHandler: authenticate }, getCmsPlans);
  app.patch(API.CMS_PLANS, { preHandler: authenticate }, patchCmsPlan);
  app.get(API.CMS_USERS, { preHandler: authenticate }, getCmsUsers);
  app.post(API.CMS_USERS, { preHandler: authenticate }, postCmsUser);
  app.post(API.CMS_USER_CREATE, { preHandler: authenticate }, postCmsUser);
  app.patch(API.CMS_USER, { preHandler: authenticate }, patchCmsUser);
  app.patch(API.CMS_USER_ROLE, { preHandler: authenticate }, patchCmsUser);
  app.get(API.CMS_ROLES, { preHandler: authenticate }, getCmsRoles);
  app.post(API.CMS_ROLES, { preHandler: authenticate }, postCmsRole);
  app.post(API.CMS_ROLE_CREATE, { preHandler: authenticate }, postCmsRole);
  app.patch(API.CMS_ROLE, { preHandler: authenticate }, patchCmsRole);
  app.patch(API.CMS_ROLE_UPDATE, { preHandler: authenticate }, patchCmsRole);
  app.delete(API.CMS_ROLE, { preHandler: authenticate }, deleteCmsRole);
  app.delete(API.CMS_ROLE_DELETE, { preHandler: authenticate }, deleteCmsRole);
  app.get(API.CMS_NOTIFICATIONS, { preHandler: authenticate }, getCmsNotifications);
  app.get(API.CMS_NOTIFICATIONS_ALIAS, { preHandler: authenticate }, getCmsNotifications);
  app.patch(API.CMS_NOTIFICATION, { preHandler: authenticate }, patchCmsNotification);
  app.patch(API.CMS_NOTIFICATION_ALIAS, { preHandler: authenticate }, patchCmsNotification);
  app.post(API.CMS_TASK_NOTIFY, { preHandler: authenticate }, postCmsTaskNotify);
};
