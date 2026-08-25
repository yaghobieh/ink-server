export const CREW_PERMISSIONS = [
  'page:read',
  'page:create',
  'page:edit',
  'page:delete',
  'page:publish',
  'page:live-edit',
  'media:read',
  'media:upload',
  'user:read',
  'user:create',
  'role:read',
  'role:create',
  'extension:read',
  'extension:install',
  'settings:read',
  'settings:edit',
] as const;

export const CREW_ROLE_SLUGS = {
  CAPTAIN: 'captain',
  OFFICER: 'officer',
  CREW: 'crew',
  GUEST: 'guest',
} as const;

export const DEFAULT_CREW_ROLES = [
  {
    slug: CREW_ROLE_SLUGS.CAPTAIN,
    name: 'Captain',
    description: 'Full CMS control — users, roles, publish, live edit.',
    permissions: [...CREW_PERMISSIONS],
    system: true,
  },
  {
    slug: CREW_ROLE_SLUGS.OFFICER,
    name: 'Officer',
    description: 'Edit and publish content; no role administration.',
    permissions: [
      'page:read',
      'page:create',
      'page:edit',
      'page:publish',
      'page:live-edit',
      'media:read',
      'media:upload',
      'extension:read',
      'settings:read',
    ],
    system: true,
  },
  {
    slug: CREW_ROLE_SLUGS.CREW,
    name: 'Crew',
    description: 'Draft and edit; cannot publish or manage users.',
    permissions: ['page:read', 'page:create', 'page:edit', 'media:read', 'media:upload'],
    system: true,
  },
  {
    slug: CREW_ROLE_SLUGS.GUEST,
    name: 'Guest',
    description: 'Read-only published content.',
    permissions: ['page:read', 'media:read'],
    system: true,
  },
] as const;

export const CREW_SYSTEM_ROLE_ADMIN = 'admin';
export const CREW_SYSTEM_ROLE_USER = 'user';
export const CREW_PROVIDER_PASSWORD = 'password';
export const CREW_PLAN_AI = 'ai';
export const CREW_PLAN_FREE = 'free';
