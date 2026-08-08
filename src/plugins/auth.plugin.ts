import type { FastifyReply, FastifyRequest } from 'fastify';
import { BEARER_PREFIX } from '../const/strings.const.js';
import type { AuthTokenPayload } from '../types/user.types.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthTokenPayload;
    user: AuthTokenPayload;
  }
}

export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  const header = request.headers.authorization;
  if (!header?.startsWith(BEARER_PREFIX)) {
    reply.code(401).send({ error: 'unauthorized' });
    return;
  }
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401).send({ error: 'unauthorized' });
  }
};

export const optionalAuthenticate = async (request: FastifyRequest): Promise<void> => {
  const header = request.headers.authorization;
  if (!header?.startsWith(BEARER_PREFIX)) return;
  try {
    await request.jwtVerify();
  } catch {
    return;
  }
};

export const getAuthUser = (request: FastifyRequest): AuthTokenPayload | undefined =>
  request.user;
