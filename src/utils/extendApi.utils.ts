import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  APPS_SERVER_ENTRY,
  API_SKIPPED,
  EXTEND_API_GUIDE,
  EXTEND_API_JSON,
  INSTALL_CONFIG_DIR,
  NEST_FRAMEWORK,
} from '../const/install.const.js';

const GUIDE_BODY = `# Extend the Bifrost API

Installment writes a Nest.js API under \`${APPS_SERVER_ENTRY}\` when **Generate extendable Nest API** is on.

Layout:

- \`src/routes\` — paths to controllers
- \`src/controllers\` — HTTP only
- \`src/services\` — logic and data
- \`src/middleware\` — live HTTP logger and error handler

Add a plugin from git (HTTPS clone into \`plugins/\`) the same way themes and modules are added to other CMS stacks.

CLI: \`bc extend\` then \`bc install\`.
`;

export const writeExtendApiMarker = async (
  rootDir: string,
  extendApi: boolean,
): Promise<string> => {
  if (!extendApi) {
    return API_SKIPPED;
  }
  const configDir = path.join(rootDir, INSTALL_CONFIG_DIR);
  await mkdir(configDir, { recursive: true });
  const jsonPath = path.join(configDir, EXTEND_API_JSON);
  await writeFile(
    jsonPath,
    `${JSON.stringify({ extendApi: true, framework: NEST_FRAMEWORK, entry: APPS_SERVER_ENTRY }, null, 2)}\n`,
    'utf8',
  );
  await writeFile(path.join(configDir, EXTEND_API_GUIDE), GUIDE_BODY, 'utf8');
  return jsonPath;
};
