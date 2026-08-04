import { isPremiumPlan } from '../const/plans.const.js';
import type { InkUserRecord, PublicUser } from '../types/user.types.js';

export const toPublicUser = (user: InkUserRecord): PublicUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  plan: user.plan,
  premium: isPremiumPlan(user.plan),
});
