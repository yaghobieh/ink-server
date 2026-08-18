import type { FastifyReply, FastifyRequest } from 'fastify';
import { CONFIG } from '../const/index.js';
import { DB_DRIVER } from '../const/install.const.js';
import { getAuthUser } from '../plugins/auth.plugin.js';
import {
  countCmsPagesByStatus,
  createCmsPage,
  listCmsPages,
  updateCmsPage,
} from '../repositories/cms.repository.js';
import { countContentStats, countContentWeekly } from '../repositories/content.repository.js';
import { countMedia } from '../repositories/media.repository.js';
import { getUsageForUser } from '../repositories/usage.repository.js';
import { findUserByEmail } from '../services/auth.service.js';
import type { CmsPageStatus } from '../types/cms.types.js';
import { listDatabaseTables } from '../utils/dbSchema.utils.js';
import { toPublicUser, userCanManagePlans } from '../utils/user.utils.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED_STATUS = new Set<CmsPageStatus>(['draft', 'published', 'archived']);

export const getCmsDashboard = async (request: FastifyRequest, reply: FastifyReply) => {
  const auth = getAuthUser(request);
  if (!auth?.email) return reply.code(401).send({ error: 'unauthorized' });
  const user = await findUserByEmail(auth.email);
  if (!user) return reply.code(404).send({ error: 'not found' });

  const [usage, pages, content, weekly, mediaCount, tables] = await Promise.all([
    getUsageForUser(user.id, user.plan),
    countCmsPagesByStatus(),
    countContentStats(),
    countContentWeekly(),
    countMedia(),
    listDatabaseTables(DB_DRIVER.POSTGRES, CONFIG.DATABASE_URL),
  ]);

  const tokensUsed = usage.tokensUsed;
  const tokensLimit = usage.tokensLimit || 1;
  const usageRate = Math.round((tokensUsed / tokensLimit) * 1000) / 10;
  const documents = content.docs;
  const published = content.published;
  const drafts = content.draft;
  const templates = content.templates;
  const tablesCount = tables.length;
  const draftRate =
    content.total > 0 ? Math.round((drafts / content.total) * 1000) / 10 : 0;

  return reply.send({
    user: toPublicUser(user),
    usage,
    pages,
    analytics: {
      documents,
      published,
      drafts,
      templates,
      media: mediaCount,
      tables: tablesCount,
      tokensUsed,
      tokensLimit,
      documentsDelta: 0,
      publishedDelta: 0,
      draftsDelta: 0,
      pageViews: documents,
      pageViewsDelta: 0,
      totalRevenue: published,
      revenueDelta: 0,
      bounceRate: draftRate,
      bounceDelta: 0,
      subscribers: mediaCount,
      subscribersDelta: 0,
      usageRate,
      salesOverview: templates,
      weekly,
      distribution: content.collections.map((collection) => ({
        label: collection.name,
        value: collection.count,
      })),
      integrations: content.collections.map((collection) => ({
        id: collection.name,
        application: collection.name,
        type: `${collection.published} published`,
        rate:
          collection.count > 0
            ? Math.round((collection.published / collection.count) * 100)
            : 0,
        profit: collection.count,
      })),
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
