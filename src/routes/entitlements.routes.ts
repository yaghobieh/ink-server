import { router, GET, POST } from '@forgedevstack/harbor';
import { API } from '../const/index.js';
import { getEntitlements, setPremium } from '../controllers/entitlements.controller.js';

export const entitlementsRoutes = router('/', [
  GET(API.ENTITLEMENTS, getEntitlements),
  POST(API.ENTITLEMENTS, setPremium),
]);
