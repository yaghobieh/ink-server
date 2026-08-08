import type { FastifyReply, FastifyRequest } from 'fastify';
import { getAuthUser } from '../plugins/auth.plugin.js';
import { listContent, upsertContent } from '../repositories/content.repository.js';
import { findUserByEmail } from '../services/auth.service.js';
import type { CmsContentStatus } from '../types/content.types.js';
import { userCanManagePlans } from '../utils/user.utils.js';

export const getCmsContent = async (request: FastifyRequest, reply: FastifyReply) => {
  const auth = getAuthUser(request);
  if (!auth?.email) return reply.code(401).send({ error: 'unauthorized' });
  const user = await findUserByEmail(auth.email);
  if (!user) return reply.code(404).send({ error: 'not found' });
  const items = await listContent();
  return reply.send({ items });
};

export const getCmsContentByCollection = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const auth = getAuthUser(request);
  if (!auth?.email) return reply.code(401).send({ error: 'unauthorized' });
  const user = await findUserByEmail(auth.email);
  if (!user) return reply.code(404).send({ error: 'not found' });
  const params = request.params as { collection?: string };
  const collection = params.collection?.trim();
  if (!collection) return reply.code(400).send({ error: 'collection required' });
  const items = await listContent(collection);
  return reply.send({ collection, items });
};

export const postCmsContent = async (request: FastifyRequest, reply: FastifyReply) => {
  const auth = getAuthUser(request);
  if (!auth?.email) return reply.code(401).send({ error: 'unauthorized' });
  const user = await findUserByEmail(auth.email);
  if (!user) return reply.code(404).send({ error: 'not found' });
  if (!userCanManagePlans(user)) return reply.code(403).send({ error: 'forbidden' });

  const body = (request.body ?? {}) as Record<string, unknown>;
  const collection = typeof body.collection === 'string' ? body.collection.trim() : '';
  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  const locale = typeof body.locale === 'string' ? body.locale.trim() : 'en';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const status = (typeof body.status === 'string' ? body.status : 'published') as CmsContentStatus;
  const payload =
    body.payload && typeof body.payload === 'object'
      ? (body.payload as Record<string, unknown>)
      : {};

  if (!collection || !slug) return reply.code(400).send({ error: 'collection and slug required' });

  const item = await upsertContent({ collection, slug, locale, title, payload, status });
  return reply.code(201).send({ item });
};
