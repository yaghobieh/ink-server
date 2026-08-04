import { findUserByEmail } from '../services/auth.service.js';
import { User } from '../models/user.model.js';
import type { InkRequest } from '../types/http.types.js';

export const getEntitlements = async (req: InkRequest) => {
  const email = typeof req.user?.email === 'string' ? req.user.email : '';
  if (!email) return { status: 401, body: { error: 'unauthorized' } };
  const user = await findUserByEmail(email);
  if (!user) return { status: 404, body: { error: 'not found' } };
  return {
    premium: Boolean(user.premium),
    licenseFeatures: user.premium
      ? ['theme', 'icons', 'richPaste', 'imageUpload', 'wysiwyg']
      : [],
  };
};

export const setPremium = async (req: InkRequest) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const email = typeof body.email === 'string' ? body.email : '';
  if (!email) return { status: 400, body: { error: 'email required' } };
  const premium = Boolean(body.premium);
  await User.updateOne({ email }, { premium });
  return { ok: true, email, premium };
};
