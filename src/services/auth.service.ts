import { JWT } from '@forgedevstack/harbor';
import { CONFIG } from '../const/index.js';
import { JWT_EXPIRES_IN_SEC } from '../const/numbers.const.js';
import { User } from '../models/user.model.js';
import type { InkUserRecord } from '../types/http.types.js';

const jwt = new JWT({
  secret: CONFIG.JWT_SECRET,
  expiresIn: JWT_EXPIRES_IN_SEC,
});

export type AuthTokenPayload = {
  userId: string;
  email: string;
  role: string;
};

export const signAuthToken = (payload: AuthTokenPayload): string => jwt.sign(payload);

export const verifyAuthToken = (token: string): AuthTokenPayload =>
  jwt.verify(token) as AuthTokenPayload;

const asUser = (doc: unknown): InkUserRecord | null => {
  if (!doc || Array.isArray(doc)) return null;
  return doc as InkUserRecord;
};

export const findOrCreateOAuthUser = async (input: {
  email: string;
  name: string;
  provider: 'google' | 'github';
  providerId: string;
}): Promise<InkUserRecord> => {
  const existing = asUser(
    await User.findOne({
      provider: input.provider,
      providerId: input.providerId,
    }),
  );
  if (existing) return existing;

  const byEmail = asUser(await User.findOne({ email: input.email }));
  if (byEmail) {
    await User.updateOne(
      { _id: byEmail._id },
      { provider: input.provider, providerId: input.providerId },
    );
    return asUser(await User.findOne({ _id: byEmail._id })) ?? byEmail;
  }

  return asUser(
    await User.create({
      email: input.email,
      name: input.name,
      provider: input.provider,
      providerId: input.providerId,
      premium: false,
    }),
  ) as InkUserRecord;
};

export const registerPasswordUser = async (input: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<InkUserRecord> =>
  asUser(
    await User.create({
      email: input.email,
      name: input.name,
      passwordHash: input.passwordHash,
      provider: 'password',
      premium: false,
    }),
  ) as InkUserRecord;

export const findUserByEmail = async (email: string): Promise<InkUserRecord | null> =>
  asUser(await User.findOne({ email }));
