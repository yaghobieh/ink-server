import { router, GET } from '@forgedevstack/harbor';
import { API } from '../const/index.js';
import { getHealth } from '../controllers/health.controller.js';

export const healthRoutes = router('/', [GET(API.HEALTH, getHealth)]);
