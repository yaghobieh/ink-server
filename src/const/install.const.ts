export const INSTALL_CONFIG_DIR = 'config';
export const INSTALL_CONFIG_JSON = 'bifrost.install.json';
export const INSTALL_CONFIG_ENV = 'bifrost.install.env';
export const INSTALL_ASSETS_DIR = 'assets';

export const MEDIA_STORAGE = {
  CLOUDINARY: 'cloudinary',
  LOCAL: 'local',
} as const;

export const DB_DRIVER = {
  POSTGRES: 'postgres',
  MONGO: 'mongo',
} as const;

export const INSTALL_STEP_IDS = [
  'validate-config',
  'ping-database',
  'write-env',
  'create-tables',
  'create-admin',
  'seed-template',
  'theme-colors',
  'generate-api',
  'clone-git',
  'apply-ai',
  'complete',
] as const;

export const INSTALL_STEP_LABELS: Record<(typeof INSTALL_STEP_IDS)[number], string> = {
  'validate-config': 'Validating configuration',
  'ping-database': 'Connecting to database',
  'write-env': 'Writing environment',
  'create-tables': 'Ensuring CMS tables',
  'create-admin': 'Creating first admin',
  'seed-template': 'Seeding template',
  'theme-colors': 'Applying theme colors',
  'generate-api': 'Generating Nest API',
  'clone-git': 'Installing from git',
  'apply-ai': 'Applying AI site prompt',
  complete: 'Install complete',
};

export const GIT_HTTPS_PREFIX = 'https://';
export const PLUGINS_DIR_NAME = 'plugins';
export const EXTEND_API_JSON = 'bifrost.extend-api.json';
export const EXTEND_API_GUIDE = 'EXTEND_API.md';
export const NEST_FRAMEWORK = 'nest';
export const APPS_SERVER_ENTRY = 'apps/server';
export const DEFAULT_PRIMARY_COLOR = '#ec4899';
export const DEFAULT_SECONDARY_COLOR = '#3b82f6';
export const GIT_CLONE_DEPTH = '1';
export const GIT_CLONE_TIMEOUT_MS = 60000;
export const GIT_SKIPPED = 'skipped';
export const AI_SKIPPED = 'no prompt';
export const API_SKIPPED = 'extend API off';
export const TEMPLATE_DOCS = 'docs-portal';
export const TEMPLATE_BLOG = 'marketing-blog';
export const TEMPLATE_BLANK = 'blank';
export const AI_DOCS_NEEDLES = ['docs', 'documentation', 'guide'];
export const AI_BLOG_NEEDLES = ['blog', 'marketing', 'landing'];
