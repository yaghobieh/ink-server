import {
  createOAuthUser,
  createPasswordUser,
  createSession,
  findUserByEmail,
  findUserByProvider,
  findUserByUsernameOrEmail,
  linkOAuthProvider,
} from '../repositories/user.repository.js';
import { JWT_EXPIRES_IN_SEC } from '../const/numbers.const.js';
import type { InkUserRecord } from '../types/user.types.js';

export type AuthTokenPayload = {
  userId: string;
  email: string;
  role: string;
};

export const buildSessionExpiry = (): Date =>
  new Date(Date.now() + JWT_EXPIRES_IN_SEC * 1000);

export const findOrCreateOAuthUser = async (input: {
  email: string;
  name: string;
  provider: 'google' | 'github';
  providerId: string;
}): Promise<InkUserRecord> => {
  const existing = await findUserByProvider(input.provider, input.providerId);
  if (existing) return existing;

  const byEmail = await findUserByEmail(input.email);
  if (byEmail) {
    await linkOAuthProvider(byEmail.id, input.provider, input.providerId);
    return (await findUserByEmail(input.email)) ?? byEmail;
  }

  return createOAuthUser({
    email: input.email,
    name: input.name,
    provider: input.provider,
    providerId: input.providerId,
  });
};

export const registerPasswordUser = async (input: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<InkUserRecord> =>
  createPasswordUser(input);

export { createSession, findUserByEmail, findUserByProvider, findUserByUsernameOrEmail };

export type { InkUserRecord };
