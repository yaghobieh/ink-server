import type { WebSocket } from 'ws';
import { pingDatabase } from '../db/index.js';
import { APP_NAME, HEALTH_OK } from '../const/index.js';
import { LIVE_HEALTH_MS } from '../const/numbers.const.js';

export type LiveHealthPayload = {
  type: 'health';
  status: string;
  service: string;
  db: boolean;
};

export type LivePresenceUser = {
  id: string;
  name: string;
};

export type LiveSocket = {
  userId: string;
  name: string;
  socket: WebSocket;
};

const clients = new Set<LiveSocket>();
let healthTimer: ReturnType<typeof setInterval> | null = null;
let healthReady = false;
let lastHealth: LiveHealthPayload = {
  type: 'health',
  status: HEALTH_OK,
  service: APP_NAME,
  db: false,
};

const sendJson = (socket: WebSocket, payload: unknown): void => {
  if (socket.readyState !== socket.OPEN) return;
  socket.send(JSON.stringify(payload));
};

export const getLastHealth = (): LiveHealthPayload => lastHealth;

const listPresence = (): LivePresenceUser[] => {
  const seen = new Map<string, LivePresenceUser>();
  for (const client of clients) {
    seen.set(client.userId, { id: client.userId, name: client.name });
  }
  return [...seen.values()];
};

export const broadcastPresence = (): void => {
  const payload = { type: 'presence', users: listPresence() };
  for (const client of clients) {
    sendJson(client.socket, payload);
  }
};

export const addLiveClient = (client: LiveSocket): void => {
  clients.add(client);
  if (healthReady) sendJson(client.socket, lastHealth);
  sendJson(client.socket, { type: 'presence', users: listPresence() });
  broadcastPresence();
};

export const removeLiveClient = (socket: WebSocket): void => {
  for (const client of clients) {
    if (client.socket === socket) {
      clients.delete(client);
    }
  }
  broadcastPresence();
};

export const broadcastHealth = (payload: LiveHealthPayload): void => {
  lastHealth = payload;
  healthReady = true;
  for (const client of clients) {
    sendJson(client.socket, payload);
  }
};

export const sendToUser = (userId: string, payload: unknown): void => {
  for (const client of clients) {
    if (client.userId === userId) {
      sendJson(client.socket, payload);
    }
  }
};

export const startLiveHealthLoop = (): void => {
  if (healthTimer) return;
  const tick = async () => {
    let db = false;
    try {
      db = await pingDatabase();
    } catch {
      db = false;
    }
    broadcastHealth({
      type: 'health',
      status: HEALTH_OK,
      service: APP_NAME,
      db,
    });
  };
  void tick();
  healthTimer = setInterval(() => {
    void tick();
  }, LIVE_HEALTH_MS);
};
