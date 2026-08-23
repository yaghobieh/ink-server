import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  CLOUDINARY_ERROR_NOT_CONFIGURED,
  CLOUDINARY_FOLDER,
  DATA_URL_PREFIX,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_SERVICE_UNAVAILABLE,
  HTTP_STATUS_UNAUTHORIZED,
  MEDIA_MAX_BYTES,
  MEDIA_RESOURCE_TYPE_IMAGE,
  MEDIA_UPLOAD_DATA_URL_KEY,
  MEDIA_UPLOAD_FILE_NAME_KEY,
} from '../const/index.js';
import { getAuthUser } from '../plugins/auth.plugin.js';
import { listMedia, upsertMedia } from '../repositories/media.repository.js';
import {
  cloudinaryMissingFields,
  createUploadSignature,
  listCloudinaryResources,
  uploadDataUrl,
} from '../services/cloudinary.service.js';
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
    const items = (remote.resources ?? []).map((resource: {
      public_id: string;
      url: string;
      secure_url: string;
      resource_type: string;
      format?: string;
      bytes?: number;
      width?: number;
      height?: number;
      folder?: string;
      created_at?: string;
    }) => ({
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

export const postCmsMediaUpload = async (request: FastifyRequest, reply: FastifyReply) => {
  const auth = getAuthUser(request);
  if (!auth?.email) {
    return reply.code(HTTP_STATUS_UNAUTHORIZED).send({ error: 'unauthorized' });
  }
  const user = await findUserByEmail(auth.email);
  if (!user) {
    return reply.code(HTTP_STATUS_NOT_FOUND).send({ error: 'not found' });
  }
  const body = (request.body ?? {}) as Record<string, unknown>;
  const dataUrl =
    typeof body[MEDIA_UPLOAD_DATA_URL_KEY] === 'string' ? body[MEDIA_UPLOAD_DATA_URL_KEY] : '';
  const fileName =
    typeof body[MEDIA_UPLOAD_FILE_NAME_KEY] === 'string' ? body[MEDIA_UPLOAD_FILE_NAME_KEY] : undefined;
  if (!dataUrl.startsWith(DATA_URL_PREFIX)) {
    return reply.code(HTTP_STATUS_BAD_REQUEST).send({ error: 'dataUrl required' });
  }
  const approxBytes = Math.ceil((dataUrl.length * 3) / 4);
  if (approxBytes > MEDIA_MAX_BYTES) {
    return reply.code(HTTP_STATUS_BAD_REQUEST).send({ error: 'file too large' });
  }
  try {
    const uploaded = await uploadDataUrl({ dataUrl, fileName });
    const item = await upsertMedia({
      publicId: uploaded.public_id,
      url: uploaded.url || uploaded.secure_url,
      secureUrl: uploaded.secure_url,
      resourceType: uploaded.resource_type || MEDIA_RESOURCE_TYPE_IMAGE,
      format: uploaded.format ?? null,
      bytes: uploaded.bytes ?? 0,
      width: uploaded.width ?? null,
      height: uploaded.height ?? null,
      folder: uploaded.folder || CLOUDINARY_FOLDER,
    });
    return reply.code(HTTP_STATUS_CREATED).send({ item });
  } catch {
    return reply.code(HTTP_STATUS_SERVICE_UNAVAILABLE).send({
      error: CLOUDINARY_ERROR_NOT_CONFIGURED,
      missing: cloudinaryMissingFields(),
    });
  }
};
