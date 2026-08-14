import type { FastifyReply, FastifyRequest } from 'fastify';
import { getAuthUser } from '../plugins/auth.plugin.js';
import { listMedia, upsertMedia } from '../repositories/media.repository.js';
import { createUploadSignature, listCloudinaryResources } from '../services/cloudinary.service.js';
import { findUserByEmail } from '../services/auth.service.js';
import { userCanManagePlans } from '../utils/user.utils.js';

export const getCmsMedia = async (request: FastifyRequest, reply: FastifyReply) => {
  const auth = getAuthUser(request);
  if (!auth?.email) return reply.code(401).send({ error: 'unauthorized' });
  const user = await findUserByEmail(auth.email);
  if (!user) return reply.code(404).send({ error: 'not found' });

  try {
    const local = await listMedia();
    if (local.length > 0) return reply.send({ items: local, source: 'db' });
    const remote = await listCloudinaryResources();
    const items = (remote.resources ?? []).map((resource) => ({
      id: resource.public_id,
      publicId: resource.public_id,
      url: resource.url,
      secureUrl: resource.secure_url,
      resourceType: resource.resource_type,
      format: resource.format ?? null,
      bytes: resource.bytes ?? 0,
      width: resource.width ?? null,
      height: resource.height ?? null,
      folder: resource.folder ?? null,
      createdAt: resource.created_at ?? new Date().toISOString(),
    }));
    return reply.send({ items, source: 'cloudinary' });
  } catch {
    return reply.send({ items: [], source: 'none' });
  }
};

export const getCmsMediaSign = async (request: FastifyRequest, reply: FastifyReply) => {
  const auth = getAuthUser(request);
  if (!auth?.email) return reply.code(401).send({ error: 'unauthorized' });
  const user = await findUserByEmail(auth.email);
  if (!user) return reply.code(404).send({ error: 'not found' });
  if (!userCanManagePlans(user)) return reply.code(403).send({ error: 'forbidden' });

  try {
    const signature = createUploadSignature('ink-cms');
    return reply.send(signature);
  } catch {
    return reply.code(503).send({ error: 'cloudinary not configured' });
  }
};

export const postCmsMedia = async (request: FastifyRequest, reply: FastifyReply) => {
  const auth = getAuthUser(request);
  if (!auth?.email) return reply.code(401).send({ error: 'unauthorized' });
  const user = await findUserByEmail(auth.email);
  if (!user) return reply.code(404).send({ error: 'not found' });
  if (!userCanManagePlans(user)) return reply.code(403).send({ error: 'forbidden' });

  const body = (request.body ?? {}) as Record<string, unknown>;
  const publicId = typeof body.publicId === 'string' ? body.publicId : '';
  const url = typeof body.url === 'string' ? body.url : '';
  const secureUrl = typeof body.secureUrl === 'string' ? body.secureUrl : url;
  if (!publicId || !secureUrl) return reply.code(400).send({ error: 'publicId and secureUrl required' });

  const item = await upsertMedia({
    publicId,
    url: url || secureUrl,
    secureUrl,
    resourceType: typeof body.resourceType === 'string' ? body.resourceType : 'image',
    format: typeof body.format === 'string' ? body.format : null,
    bytes: typeof body.bytes === 'number' ? body.bytes : 0,
    width: typeof body.width === 'number' ? body.width : null,
    height: typeof body.height === 'number' ? body.height : null,
    folder: typeof body.folder === 'string' ? body.folder : 'ink-cms',
  });
  return reply.code(201).send({ item });
};
