import { router, POST } from '@forgedevstack/harbor';
import { API } from '../const/index.js';
import { advisePayments } from '../controllers/payments.controller.js';

export const paymentsRoutes = router('/', [POST(API.PAYMENTS_AI, advisePayments)]);
