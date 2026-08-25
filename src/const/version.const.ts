export const ENV_GIT_SHA = 'GIT_SHA';
export const ENV_BUILD_SHA = 'BUILD_SHA';
export const ENV_BUILD_TIME = 'BUILD_TIME';
export const ENV_BUILD_NUMBER = 'BUILD_NUMBER';
export const ENV_DOCKER = 'DOCKER';
export const ENV_DOCKER_IMAGE = 'DOCKER_IMAGE';
export const ENV_BIFROST_VERSION = 'BIFROST_VERSION';
export const ENV_INK_VERSION = 'INK_VERSION';
export const ENV_CMS_VERSION = 'CMS_VERSION';
export const ENV_PORTAL_VERSION = 'PORTAL_VERSION';
export const DOCKER_ENV_PATH = '/.dockerenv';
export const PACKAGE_JSON = 'package.json';
export const PACKAGE_NAME_BIFROST = 'bifrost';
export const PACKAGE_NAME_CMS_FE = '@forgedevstack/cms-fe';
export const PACKAGE_NAME_INK = '@forgedevstack/ink';
export const PACKAGE_NAME_INK_PORTAL = 'ink-portal';
export const PACKAGE_NAME_SERVER = '@forgedevstack/bifrost-server';
export const PRODUCT_BIFROST = 'Bifrost';
export const NODE_MODULES_INK_JSON = ['node_modules', '@forgedevstack', 'ink', 'package.json'] as const;
export const CHILD_PACKAGE_JSON_PATHS = [
  ['bifrost', 'package.json'],
  ['ink', 'package.json'],
  ['ink-portal', 'package.json'],
  ['apps', 'cms-fe', 'package.json'],
  ['bifrost', 'apps', 'cms-fe', 'package.json'],
  ['ink-portal', 'node_modules', '@forgedevstack', 'ink', 'package.json'],
  ['apps', 'cms-fe', 'node_modules', '@forgedevstack', 'ink', 'package.json'],
] as const;
export const VERSION_DIR_WALK_MAX = 12;
export const ENV_DOCKER_TRUE = '1';
