import type { IncomingMessage, ServerResponse } from 'node:http';
import { CONFIG } from './const/index.js';
import { buildApp } from './app.js';

let appInstance: Awaited<ReturnType<typeof buildApp>> | null = null;

const getApp = async () => {
  if (!appInstance) {
    appInstance = await buildApp();
    await appInstance.ready();
  }
  return appInstance;
};

const isDirectRun = process.argv[1]?.includes('server');

if (isDirectRun) {
  getApp()
    .then((app) =>
      app.listen({ port: CONFIG.PORT, host: '0.0.0.0' }).then(() => {
        console.log(`ink-server listening on http://localhost:${CONFIG.PORT}`);
      }),
    )
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp();
  app.server.emit('request', req, res);
}
