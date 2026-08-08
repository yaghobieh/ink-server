import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { CONFIG } from './const/index.js';
import { JWT_EXPIRES_IN_SEC } from './const/numbers.const.js';
import { registerRoutes } from './routes/index.js';

export const buildApp = async () => {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: CONFIG.CORS_ORIGIN,
    credentials: true,
  });

  await app.register(jwt, {
    secret: CONFIG.JWT_SECRET,
    sign: { expiresIn: JWT_EXPIRES_IN_SEC },
  });

  registerRoutes(app);

  return app;
};
