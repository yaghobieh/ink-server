import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  getPublishedContentBySlug,
  listPublishedContent,
} from '../repositories/content.repository.js';

const DOCS_COLLECTION = 'docs';
const DEFAULT_LOCALE = 'en';

export const getPublicDocs = async (_request: FastifyRequest, reply: FastifyReply) => {
  const items = await listPublishedContent(DOCS_COLLECTION, DEFAULT_LOCALE);
  return reply.send({
    items: items.map((item) => ({
      slug: item.slug,
      title: item.title,
      status: item.status,
      updatedAt: item.updatedAt,
    })),
  });
};

export const getPublicDocBySlug = async (request: FastifyRequest, reply: FastifyReply) => {
  const params = request.params as { slug?: string };
  const slug = typeof params.slug === 'string' ? params.slug.trim().toLowerCase() : '';
  if (!slug) return reply.code(400).send({ error: 'slug required' });

  const item = await getPublishedContentBySlug(DOCS_COLLECTION, slug, DEFAULT_LOCALE);
  if (!item) return reply.code(404).send({ error: 'not found' });
  return reply.send({ item });
};
