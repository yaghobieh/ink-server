import { existsSync, readFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NUMBER_ZERO } from '../const/numbers.const.js';
import { EMPTY_STRING } from '../const/strings.const.js';
import {
  CHILD_PACKAGE_JSON_PATHS,
  DOCKER_ENV_PATH,
  ENV_BIFROST_VERSION,
  ENV_BUILD_NUMBER,
  ENV_BUILD_SHA,
  ENV_BUILD_TIME,
  ENV_CMS_VERSION,
  ENV_DOCKER,
  ENV_DOCKER_IMAGE,
  ENV_DOCKER_TRUE,
  ENV_GIT_SHA,
  ENV_INK_VERSION,
  ENV_PORTAL_VERSION,
  NODE_MODULES_INK_JSON,
  PACKAGE_JSON,
  PACKAGE_NAME_BIFROST,
  PACKAGE_NAME_CMS_FE,
  PACKAGE_NAME_INK,
  PACKAGE_NAME_INK_PORTAL,
  PACKAGE_NAME_SERVER,
  PRODUCT_BIFROST,
  VERSION_DIR_WALK_MAX,
} from '../const/version.const.js';
import type { VersionInfo } from '../types/version.types.js';

const HERE = dirname(fileURLToPath(import.meta.url));

const readEnv = (name: string): string => {
  const value = process.env[name];
  if (typeof value !== 'string') {
    return EMPTY_STRING;
  }
  return value.trim();
};

const readPackage = (filePath: string): { name: string; version: string } | null => {
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as {
      name?: unknown;
      version?: unknown;
    };
    const name = typeof parsed.name === 'string' ? parsed.name : EMPTY_STRING;
    const version = typeof parsed.version === 'string' ? parsed.version : EMPTY_STRING;
    if (!name && !version) {
      return null;
    }
    return { name, version };
  } catch {
    return null;
  }
};

const walkDirs = (start: string): string[] => {
  const dirs: string[] = [];
  let current = start;
  let index = NUMBER_ZERO;
  while (index < VERSION_DIR_WALK_MAX) {
    dirs.push(current);
    const parent = join(current, '..');
    if (parent === current) {
      break;
    }
    current = parent;
    index += 1;
  }
  return dirs;
};

const firstNonEmpty = (values: Array<string | undefined>): string => {
  const hit = values.find((value) => {
    if (typeof value !== 'string') {
      return false;
    }
    return value.length > NUMBER_ZERO;
  });
  return hit ?? EMPTY_STRING;
};

const collectVersions = (): Record<string, string> => {
  const found: Record<string, string> = {};
  const starts = [process.cwd(), join(HERE, '..', '..')];
  const dirs = starts.flatMap((start) => walkDirs(start));
  dirs.forEach((dir) => {
    const pkg = readPackage(join(dir, PACKAGE_JSON));
    if (pkg?.name && pkg.version && !found[pkg.name]) {
      found[pkg.name] = pkg.version;
    }
    const inkPkg = readPackage(join(dir, ...NODE_MODULES_INK_JSON));
    if (inkPkg?.version && !found[PACKAGE_NAME_INK]) {
      found[PACKAGE_NAME_INK] = inkPkg.version;
    }
    CHILD_PACKAGE_JSON_PATHS.forEach((segments) => {
      const childPkg = readPackage(join(dir, ...segments));
      if (childPkg?.name && childPkg.version && !found[childPkg.name]) {
        found[childPkg.name] = childPkg.version;
      }
    });
  });
  return found;
};

const isDocker = (): boolean => {
  if (existsSync(DOCKER_ENV_PATH)) {
    return true;
  }
  return readEnv(ENV_DOCKER) === ENV_DOCKER_TRUE;
};

export const getVersionInfo = (): VersionInfo => {
  const packages = collectVersions();
  const host = hostname();
  return {
    product: PRODUCT_BIFROST,
    version: firstNonEmpty([
      readEnv(ENV_BIFROST_VERSION),
      packages[PACKAGE_NAME_BIFROST],
      packages[PACKAGE_NAME_SERVER],
    ]),
    ink: firstNonEmpty([readEnv(ENV_INK_VERSION), packages[PACKAGE_NAME_INK]]),
    portal: firstNonEmpty([
      readEnv(ENV_CMS_VERSION),
      readEnv(ENV_PORTAL_VERSION),
      packages[PACKAGE_NAME_CMS_FE],
      packages[PACKAGE_NAME_INK_PORTAL],
    ]),
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    env: process.env.NODE_ENV ?? EMPTY_STRING,
    uptimeSec: Math.floor(process.uptime()),
    docker: {
      running: isDocker(),
      hostname: host,
      image: readEnv(ENV_DOCKER_IMAGE),
      containerName: isDocker() ? host : EMPTY_STRING,
    },
    build: {
      sha: firstNonEmpty([readEnv(ENV_GIT_SHA), readEnv(ENV_BUILD_SHA)]),
      time: readEnv(ENV_BUILD_TIME),
      number: readEnv(ENV_BUILD_NUMBER),
    },
  };
};
