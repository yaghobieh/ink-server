import type { FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';
import { QUERY_PARAM_TOKEN } from '../../const/strings.const.js';
import { findUserByEmail } from '../../services/auth.service.js';
import {
  addLiveClient,
  removeLiveClient,
  startLiveHealthLoop,
} from '../../utils/liveHub.utils.js';
import {
  listNotifications,
  unreadNotificationCount,
} from '../../repositories/notification.repository.js';

const tokenFromRequest = (request: FastifyRequest): string => {
  const query = request.query as Record<string, unknown>;
  const fromQuery = query[QUERY_PARAM_TOKEN];
  if (typeof fromQuery === 'string' && fromQuery) return fromQuery;
  const header = request.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length);
  return '';
};

export const handleLiveSocket = async (
  socket: WebSocket,
  request: FastifyRequest,
): Promise<void> => {
  startLiveHealthLoop();
  const token = tokenFromRequest(request);
  if (!token) {
    socket.close();
    return;
  }
  try {
    const payload = await request.server.jwt.verify<{ email?: string }>(token);
    if (!payload.email) {
      socket.close();
      return;
    }
    const user = await findUserByEmail(payload.email);
    if (!user) {
      socket.close();
      return;
    }
    addLiveClient({ userId: user.id, name: user.name || user.username || user.email, socket });
    const items = await listNotifications(user.id);
    const unread = await unreadNotificationCount(user.id);
    socket.send(JSON.stringify({ type: 'notifications', items, unread }));
    socket.on('close', () => {
      removeLiveClient(socket);
    });
  } catch {
    socket.close();
  }
};
