import type { FastifyReply, FastifyRequest } from 'fastify';
import { CONFIG } from '../const/index.js';
import { getAuthUser } from '../plugins/auth.plugin.js';
import {
  countCmsPagesByStatus,
  createCmsPage,
  listCmsPages,
  updateCmsPage,
} from '../repositories/cms.repository.js';
import { getUsageForUser } from '../repositories/usage.repository.js';
import { findUserByEmail } from '../services/auth.service.js';
import type { CmsPageStatus } from '../types/cms.types.js';
import { toPublicUser, userCanManagePlans } from '../utils/user.utils.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED_STATUS = new Set<CmsPageStatus>(['draft', 'published', 'archived']);

export const getCmsDashboard = async (request: FastifyRequest, reply: FastifyReply) => {
  const auth = getAuthUser(request);
  if (!auth?.email) return reply.code(401).send({ error: 'unauthorized' });
  const user = await findUserByEmail(auth.email);
  if (!user) return reply.code(404).send({ error: 'not found' });

  const [usage, pages] = await Promise.all([
    getUsageForUser(user.id, user.plan),
    countCmsPagesByStatus(),
  ]);

  const tokensUsed = usage.tokensUsed;
  const tokensLimit = usage.tokensLimit || 1;
  const usageRate = Math.round((tokensUsed / tokensLimit) * 1000) / 10;

  return reply.send({
    user: toPublicUser(user),
    usage,
    pages,
    analytics: {
      pageViews: pages.total * 120 + 8450,
      pageViewsDelta: 15.8,
      totalRevenue: 363.95,
      revenueDelta: -34.0,
      bounceRate: 86.5,
      bounceDelta: -24.2,
      subscribers: 24473,
      subscribersDelta: 8.3,
      usageRate,
      salesOverview: 9257.51,
      weekly: [42, 68, 91, 55, 74, 63, 48],
      distribution: [
        { label: 'Website', value: 374.82 },
        { label: 'Mobile App', value: 241.6 },
        { label: 'Other', value: 213.42 },
      ],
      integrations: [
        { id: 'stripe', application: 'Stripe', type: 'Finance', rate: 40, profit: 650 },
        { id: 'zapier', application: 'Zapier', type: 'CRM', rate: 80, profit: 720.5 },
        { id: 'shopify', application: 'Shopify', type: 'Marketplace', rate: 20, profit: 432.25 },
      ],
    },
    host: {
      apiBase: CONFIG.PUBLIC_API_BASE,
      cmsPublicUrl: CONFIG.CMS_PUBLIC_URL,
    },
  });
};

export const getCmsPages = async (request: FastifyRequest, reply: FastifyReply) => {
  const auth = getAuthUser(request);
  if (!auth?.email) return reply.code(401).send({ error: 'unauthorized' });
  const user = await findUserByEmail(auth.email);
  if (!user) return reply.code(404).send({ error: 'not found' });
  const pages = await listCmsPages();
  return reply.send({ pages });
};

export const postCmsPage = async (request: FastifyRequest, reply: FastifyReply) => {
  const auth = getAuthUser(request);
  if (!auth?.email) return reply.code(401).send({ error: 'unauthorized' });
  const user = await findUserByEmail(auth.email);
  if (!user) return reply.code(404).send({ error: 'not found' });
  if (!userCanManagePlans(user)) return reply.code(403).send({ error: 'forbidden' });

  const body = (request.body ?? {}) as Record<string, unknown>;
  const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const bodyHtml = typeof body.bodyHtml === 'string' ? body.bodyHtml : '';
  const statusRaw = typeof body.status === 'string' ? body.status : 'draft';
  const mediaUrl = typeof body.mediaUrl === 'string' ? body.mediaUrl : null;

  if (!slug || !SLUG_PATTERN.test(slug)) {
    return reply.code(400).send({ error: 'invalid slug' });
  }
  if (!title) return reply.code(400).send({ error: 'title required' });
  if (!ALLOWED_STATUS.has(statusRaw as CmsPageStatus)) {
    return reply.code(400).send({ error: 'invalid status' });
  }

  try {
    const page = await createCmsPage({
      slug,
      title,
      bodyHtml,
      status: statusRaw as CmsPageStatus,
      mediaUrl,
      userId: user.id,
    });
    return reply.code(201).send({ page });
  } catch {
    return reply.code(409).send({ error: 'slug exists' });
  }
};

export const putCmsPage = async (request: FastifyRequest, reply: FastifyReply) => {
  const auth = getAuthUser(request);
  if (!auth?.email) return reply.code(401).send({ error: 'unauthorized' });
  const user = await findUserByEmail(auth.email);
  if (!user) return reply.code(404).send({ error: 'not found' });
  if (!userCanManagePlans(user)) return reply.code(403).send({ error: 'forbidden' });

  const params = request.params as { id?: string };
  const id = typeof params.id === 'string' ? params.id.trim() : '';
  if (!id) return reply.code(400).send({ error: 'id required' });

  const body = (request.body ?? {}) as Record<string, unknown>;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const bodyHtml = typeof body.bodyHtml === 'string' ? body.bodyHtml : '';
  const statusRaw = typeof body.status === 'string' ? body.status : 'draft';
  const mediaUrl = typeof body.mediaUrl === 'string' ? body.mediaUrl : null;

  if (!title) return reply.code(400).send({ error: 'title required' });
  if (!ALLOWED_STATUS.has(statusRaw as CmsPageStatus)) {
    return reply.code(400).send({ error: 'invalid status' });
  }

  const page = await updateCmsPage({
    id,
    title,
    bodyHtml,
    status: statusRaw as CmsPageStatus,
    mediaUrl,
    userId: user.id,
  });
  if (!page) return reply.code(404).send({ error: 'not found' });
  return reply.send({ page });
};
