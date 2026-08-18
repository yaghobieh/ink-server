import type { FastifyReply, FastifyRequest } from 'fastify';
import { getInstallStatus, runInstall } from '../services/install.service.js';
import type { InstallRequestBody } from '../types/install.types.js';

export const postInstall = async (request: FastifyRequest, reply: FastifyReply) => {
  const body = (request.body ?? {}) as InstallRequestBody;
  const result = await runInstall(body);
  return reply.code(result.ok ? 200 : 400).send(result);
};

export const getInstallStatusHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
  const status = await getInstallStatus();
  return reply.send(status);
};
