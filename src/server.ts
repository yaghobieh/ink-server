import { createServer, connect, httpLogger } from '@forgedevstack/harbor';
import { CONFIG } from './const/index.js';
import {
  authRoutes,
  entitlementsRoutes,
  healthRoutes,
  paymentsRoutes,
} from './routes/index.js';

async function bootstrap() {
  await connect(CONFIG.MONGODB_URI);
  console.log('Connected to MongoDB');

  const server = createServer({
    port: CONFIG.PORT,
  });

  server.app.use(httpLogger());
  server.app.use(healthRoutes);
  server.app.use(authRoutes);
  server.app.use(entitlementsRoutes);
  server.app.use(paymentsRoutes);

  console.log(`ink-server listening on http://localhost:${CONFIG.PORT}`);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
