import { advisePaymentsForSeller } from '../services/paymentsAi.service.js';
import type { InkRequest } from '../types/http.types.js';

export const advisePayments = async (req: InkRequest) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  return advisePaymentsForSeller({
    country: typeof body.country === 'string' ? body.country : undefined,
    currency: typeof body.currency === 'string' ? body.currency : undefined,
    amountIls: typeof body.amountIls === 'number' ? body.amountIls : undefined,
    businessType: typeof body.businessType === 'string' ? body.businessType : undefined,
  });
};
