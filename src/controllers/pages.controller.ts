import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  DEFAULT_PAGE_LOCALE,
  NAME_PATTERN,
  PAGE_TYPE_ALIASES,
} from '../const/pages.const.js';
import { getAuthUser } from '../plugins/auth.plugin.js';
import {
  deleteContent,
  getContentBySlug,
  getPublishedContentBySlug,
  listContent,
  listPublishedContent,
  upsertContent,
} from '../repositories/content.repository.js';
import { findUserByEmail } from '../services/auth.service.js';
import type { CmsContentStatus } from '../types/content.types.js';
import { userCanManagePlans } from '../utils/user.utils.js';

const resolveCollection = (typeRaw: unknown): string | null => {
  if (typeof typeRaw !== 'string' || !typeRaw.trim()) return null;
  const key = typeRaw.trim().toLowerCase();
  return PAGE_TYPE_ALIASES[key] ?? null;
};

const resolveName = (nameRaw: unknown): string => {
  if (typeof nameRaw !== 'string') return '';
  return nameRaw.trim().toLowerCase();
};

const toPageResponse = (item: {
  id: string;
  collection: string;
  slug: string;
  locale: string;
  title: string;
  payload: Record<string, unknown>;
  status: string;
  updatedAt: string;
}) => ({
  id: item.id,
  name: item.slug,
  type: item.collection === 'docs' ? 'doc' : item.collection === 'pages' ? 'page' : item.collection,
  locale: item.locale,
  title: item.title,
  status: item.status,
  payload: item.payload,
  updatedAt: item.updatedAt,
});

const readQuery = (request: FastifyRequest) => {
  const query = request.query as Record<string, unknown>;
  return {
    name: resolveName(query.name),
    type: resolveCollection(query.type),
    locale:
      typeof query.locale === 'string' && query.locale.trim()
        ? query.locale.trim().toLowerCase()
        : DEFAULT_PAGE_LOCALE,
  };
};

export const getPages = async (request: FastifyRequest, reply: FastifyReply) => {
  const { name, type, locale } = readQuery(request);

  if (name && type) {
    const item = await getPublishedContentBySlug(type, name, locale);
    if (!item) return reply.code(404).send({ error: 'not found' });
    return reply.send({ page: toPageResponse(item) });
  }

  if (type) {
    const items = await listPublishedContent(type, locale);
    return reply.send({ pages: items.map(toPageResponse) });
  }

  const items = await listContent();
  const published = items.filter((item) => item.status === 'published' && item.locale === locale);
  return reply.send({ pages: published.map(toPageResponse) });
};

export const postPages = async (request: FastifyRequest, reply: FastifyReply) => {
  const auth = getAuthUser(request);
  if (!auth?.email) return reply.code(401).send({ error: 'unauthorized' });
  const user = await findUserByEmail(auth.email);
  if (!user) return reply.code(404).send({ error: 'not found' });
  if (!userCanManagePlans(user)) return reply.code(403).send({ error: 'forbidden' });

  const body = (request.body ?? {}) as Record<string, unknown>;
  const query = readQuery(request);
  const name = resolveName(body.name) || query.name;
  const type = resolveCollection(body.type) || query.type;
  const locale =
    typeof body.locale === 'string' && body.locale.trim()
      ? body.locale.trim().toLowerCase()
      : query.locale;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const statusRaw = typeof body.status === 'string' ? body.status : 'published';
  const payload =
    body.payload && typeof body.payload === 'object'
      ? (body.payload as Record<string, unknown>)
      : {};

  if (!type) return reply.code(400).send({ error: 'type required (doc|page|system|blog)' });
  if (!name || !NAME_PATTERN.test(name)) {
    return reply.code(400).send({ error: 'invalid name' });
  }
  if (!title) return reply.code(400).send({ error: 'title required' });
  if (!['draft', 'published', 'archived'].includes(statusRaw)) {
    return reply.code(400).send({ error: 'invalid status' });
  }

  const page = await upsertContent({
    collection: type,
    slug: name,
    locale,
    title,
    payload,
    status: statusRaw as CmsContentStatus,
  });
  return reply.code(200).send({ page: toPageResponse(page) });
};

export const deletePages = async (request: FastifyRequest, reply: FastifyReply) => {
  const auth = getAuthUser(request);
  if (!auth?.email) return reply.code(401).send({ error: 'unauthorized' });
  const user = await findUserByEmail(auth.email);
  if (!user) return reply.code(404).send({ error: 'not found' });
  if (!userCanManagePlans(user)) return reply.code(403).send({ error: 'forbidden' });

  const { name, type, locale } = readQuery(request);
  if (!type || !name) {
    return reply.code(400).send({ error: 'name and type required' });
  }

  const existing = await getContentBySlug(type, name, locale);
  if (!existing) return reply.code(404).send({ error: 'not found' });

  const deleted = await deleteContent(type, name, locale);
  if (!deleted) return reply.code(404).send({ error: 'not found' });
  return reply.send({ ok: true, name, type: type === 'docs' ? 'doc' : type });
};
