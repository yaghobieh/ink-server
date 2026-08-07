import { canManagePlans, isCrmAdmin, isPremiumPlan } from '../const/plans.const.js';
import type { InkUserRecord, PublicUser, UserRole } from '../types/user.types.js';

export const toPublicUser = (user: InkUserRecord): PublicUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  plan: user.plan,
  premium: isPremiumPlan(user.plan),
});

export { canManagePlans, isCrmAdmin };

export const userCanManagePlans = (user: InkUserRecord | { role: UserRole }): boolean =>
  canManagePlans(user.role);
