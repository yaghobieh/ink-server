import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { CONFIG } from '../const/index.js';
import {
  findOrCreateOAuthUser,
  findUserByEmail,
  registerPasswordUser,
  signAuthToken,
} from '../services/auth.service.js';
import type { InkRequest } from '../types/http.types.js';

const hashPassword = (password: string): string =>
  createHash('sha256').update(`${CONFIG.JWT_SECRET}:${password}`).digest('hex');

const safeEqual = (a: string, b: string): boolean => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
};

const str = (value: unknown): string => (typeof value === 'string' ? value : '');

export const register = async (req: InkRequest) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const email = str(body.email);
  const name = str(body.name);
  const password = str(body.password);
  if (!email || !name || !password) {
    return { status: 400, body: { error: 'email, name, password required' } };
  }
  const existing = await findUserByEmail(email);
  if (existing) return { status: 409, body: { error: 'email already registered' } };

  const user = await registerPasswordUser({
    email,
    name,
    passwordHash: hashPassword(password),
  });
  const token = signAuthToken({
    userId: String(user._id),
    email: user.email,
    role: user.role ?? 'user',
  });
  return { user: { id: user._id, email: user.email, name: user.name, premium: user.premium }, token };
};

export const login = async (req: InkRequest) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const email = str(body.email);
  const password = str(body.password);
  if (!email || !password) {
    return { status: 400, body: { error: 'email and password required' } };
  }
  const user = await findUserByEmail(email);
  if (!user?.passwordHash || !safeEqual(user.passwordHash, hashPassword(password))) {
    return { status: 401, body: { error: 'invalid credentials' } };
  }
  const token = signAuthToken({
    userId: String(user._id),
    email: user.email,
    role: user.role ?? 'user',
  });
  return { user: { id: user._id, email: user.email, name: user.name, premium: user.premium }, token };
};

export const me = async (req: InkRequest) => {
  const email = str(req.user?.email);
  if (!email) return { status: 401, body: { error: 'unauthorized' } };
  const user = await findUserByEmail(email);
  if (!user) return { status: 404, body: { error: 'not found' } };
  return { user: { id: user._id, email: user.email, name: user.name, premium: user.premium } };
};

export const startGoogleOAuth = async (_req: InkRequest) => {
  const state = randomBytes(16).toString('hex');
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', CONFIG.GOOGLE_CLIENT_ID);
  url.searchParams.set('redirect_uri', `${CONFIG.OAUTH_CALLBACK_BASE}/api/auth/google/callback`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  return { url: url.toString(), state, stub: !CONFIG.GOOGLE_CLIENT_ID };
};

export const startGithubOAuth = async (_req: InkRequest) => {
  const state = randomBytes(16).toString('hex');
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', CONFIG.GITHUB_CLIENT_ID);
  url.searchParams.set('redirect_uri', `${CONFIG.OAUTH_CALLBACK_BASE}/api/auth/github/callback`);
  url.searchParams.set('scope', 'read:user user:email');
  url.searchParams.set('state', state);
  return { url: url.toString(), state, stub: !CONFIG.GITHUB_CLIENT_ID };
};

export const oauthCallbackStub = async (req: InkRequest, provider: 'google' | 'github') => {
  const email = str(req.query?.email) || `${provider}-user@inkforgejs.com`;
  const name = str(req.query?.name) || `${provider} user`;
  const providerId = str(req.query?.id) || `${provider}-dev`;
  const user = await findOrCreateOAuthUser({ email, name, provider, providerId });
  const token = signAuthToken({
    userId: String(user._id),
    email: user.email,
    role: user.role ?? 'user',
  });
  return {
    note: 'Sprint 2 scaffold — exchange real OAuth code for profile in production',
    user: { id: user._id, email: user.email, name: user.name, premium: user.premium },
    token,
  };
};

export const googleCallback = async (req: InkRequest) => oauthCallbackStub(req, 'google');
export const githubCallback = async (req: InkRequest) => oauthCallbackStub(req, 'github');
