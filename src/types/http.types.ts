import type { FastifyRequest } from 'fastify';
import type { AuthTokenPayload } from './user.types.js';

export type InkRequest = FastifyRequest & {
  inkUser?: AuthTokenPayload;
};

export type ErrorBody = {
  error: string;
};
