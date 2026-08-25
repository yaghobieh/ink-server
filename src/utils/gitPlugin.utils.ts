import { execFile } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import {
  GIT_CLONE_DEPTH,
  GIT_CLONE_TIMEOUT_MS,
  GIT_HTTPS_PREFIX,
  GIT_SKIPPED,
  PLUGINS_DIR_NAME,
} from '../const/install.const.js';

const execFileAsync = promisify(execFile);

export const isHttpsGitUrl = (url: string): boolean =>
  url.startsWith(GIT_HTTPS_PREFIX) && !url.includes(' ');

export const cloneGitPlugin = async (
  gitRepoUrl: string | undefined,
  rootDir: string,
): Promise<string> => {
  if (!gitRepoUrl || !isHttpsGitUrl(gitRepoUrl)) {
    return GIT_SKIPPED;
  }
  const pluginsDir = path.join(rootDir, PLUGINS_DIR_NAME);
  await mkdir(pluginsDir, { recursive: true });
  const folderName = gitRepoUrl
    .replace(/\.git$/i, '')
    .split('/')
    .filter(Boolean)
    .at(-1) || 'plugin';
  const dest = path.join(pluginsDir, folderName);
  await execFileAsync('git', ['clone', '--depth', GIT_CLONE_DEPTH, gitRepoUrl, dest], {
    timeout: GIT_CLONE_TIMEOUT_MS,
  });
  return dest;
};
