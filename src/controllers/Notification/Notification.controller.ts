import type { FastifyReply, FastifyRequest } from 'fastify';
import { getAuthUser } from '../../plugins/auth.plugin.js';
import { findUserByEmail } from '../../repositories/user.repository.js';
import { countContentStats } from '../../repositories/content.repository.js';
import { listCrewUsers } from '../../repositories/crew.repository.js';
import {
  TASK_NOTIFY_HREF,
  TASK_NOTIFY_KEY_PREFIX,
  TASK_NOTIFY_SEVERITY,
  TASK_NOTIFY_TITLE,
} from '../../const/strings.const.js';
import {
  insertUserNotification,
  listNotifications,
  markNotificationRead,
  mediaConfigured,
  syncSystemNotifications,
  unreadNotificationCount,
} from '../../repositories/notification.repository.js';
import { redisConfigured } from '../../utils/redis.utils.js';

const requireUser = async (request: FastifyRequest, reply: FastifyReply) => {
  const auth = getAuthUser(request);
  if (!auth?.email) {
    reply.code(401).send({ error: 'unauthorized' });
    return null;
  }
  const user = await findUserByEmail(auth.email);
  if (!user) {
    reply.code(404).send({ error: 'not found' });
    return null;
  }
  return user;
};

export const getCmsNotifications = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = await requireUser(request, reply);
  if (!user) return;
  const [content, crew] = await Promise.all([countContentStats(), listCrewUsers()]);
  await syncSystemNotifications(user.id, {
    drafts: content.draft,
    crew: crew.length,
    mediaReady: mediaConfigured(),
  });
  const query = request.query as Record<string, unknown>;
  const from = typeof query.from === 'string' ? query.from : undefined;
  const to = typeof query.to === 'string' ? query.to : undefined;
  const items = await listNotifications(user.id, { from, to });
  const unread = await unreadNotificationCount(user.id);
  return reply.send({ items, unread, redis: redisConfigured() });
};

export const patchCmsNotification = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = await requireUser(request, reply);
  if (!user) return;
  const params = request.params as Record<string, unknown>;
  const id = typeof params.id === 'string' ? params.id : '';
  if (!id) return reply.code(400).send({ error: 'id required' });
  const item = await markNotificationRead(user.id, id);
  if (!item) return reply.code(404).send({ error: 'not found' });
  return reply.send({ item });
};

export const postCmsTaskNotify = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = await requireUser(request, reply);
  if (!user) return;
  const body = request.body as Record<string, unknown>;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  const agentIds = Array.isArray(body.agentIds)
    ? body.agentIds.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];
  if (!title || agentIds.length === 0) {
    return reply.code(400).send({ error: 'title and agentIds required' });
  }
  await Promise.all(
    agentIds.map((agentId) =>
      insertUserNotification({
        userId: agentId,
        sourceKey: `${TASK_NOTIFY_KEY_PREFIX}${user.id}-${agentId}-${Date.now()}`,
        title: TASK_NOTIFY_TITLE,
        body: text ? `${title} · ${text}` : title,
        href: TASK_NOTIFY_HREF,
        severity: TASK_NOTIFY_SEVERITY,
      }),
    ),
  );
  return reply.send({ ok: true });
};
