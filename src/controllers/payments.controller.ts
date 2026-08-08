import type { FastifyReply, FastifyRequest } from 'fastify';
import { advisePaymentsForSeller } from '../services/paymentsAi.service.js';

export const advisePayments = async (request: FastifyRequest, reply: FastifyReply) => {
  const body = (request.body ?? {}) as Record<string, unknown>;
  const result = advisePaymentsForSeller({
    country: typeof body.country === 'string' ? body.country : undefined,
    currency: typeof body.currency === 'string' ? body.currency : undefined,
    amountIls: typeof body.amountIls === 'number' ? body.amountIls : undefined,
    businessType: typeof body.businessType === 'string' ? body.businessType : undefined,
  });
  return reply.send(result);
};
