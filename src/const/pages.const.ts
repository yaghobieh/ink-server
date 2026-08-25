export const PAGE_TYPES = {
  DOC: 'doc',
  PAGE: 'page',
  SYSTEM: 'system',
  BLOG: 'blog',
} as const;

export const PAGE_TYPE_ALIASES: Record<string, string> = {
  doc: 'docs',
  docs: 'docs',
  page: 'pages',
  pages: 'pages',
  system: 'system',
  blog: 'blog',
};

export const DEFAULT_PAGE_LOCALE = 'en';
export const SYSTEM_404_SLUG = '404';

export const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
