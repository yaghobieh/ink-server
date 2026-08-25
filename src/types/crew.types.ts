import type { CREW_PERMISSIONS } from '../const/crew.const.js';

export type CrewPermission = (typeof CREW_PERMISSIONS)[number];

export type CrewRoleRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  permissions: CrewPermission[];
  system: boolean;
};

export type CrewUserRecord = {
  id: string;
  name: string;
  email: string;
  username: string;
  roleIds: string[];
  active: boolean;
};
