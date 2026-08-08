import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { CONFIG } from '../const/index.js';
import { OAUTH_FETCH_TIMEOUT_MS, OAUTH_STATE_BYTES } from '../const/numbers.const.js';
import {
  AUDIT_RESOURCE_AUTH,
  BEARER_PREFIX,
  CONTENT_TYPE_FORM_URLENCODED,
  HEADER_AUTHORIZATION,
  HEADER_CONTENT_TYPE,
  OAUTH_GITHUB_AUTH_URL,
  OAUTH_GITHUB_SCOPE,
  OAUTH_GOOGLE_AUTH_URL,
  OAUTH_GOOGLE_SCOPE,
  OAUTH_GOOGLE_TOKEN_URL,
  OAUTH_GOOGLE_USERINFO_URL,
  OAUTH_GRANT_TYPE_AUTHORIZATION_CODE,
  OAUTH_PROVIDER_GITHUB,
  OAUTH_PROVIDER_GOOGLE,
  OAUTH_RESPONSE_TYPE_CODE,
  PORTAL_OAUTH_CALLBACK_PATH,
  QUERY_PARAM_CODE,
  QUERY_PARAM_EMAIL,
  QUERY_PARAM_FORMAT,
  QUERY_PARAM_ID,
  QUERY_PARAM_NAME,
  QUERY_PARAM_TOKEN,
  RESPONSE_FORMAT_JSON,
} from '../const/strings.const.js';
import { insertAuditLog } from '../repositories/audit.repository.js';
import {
  buildSessionExpiry,
  createSession,
  findOrCreateOAuthUser,
  findUserByEmail,
  registerPasswordUser,
} from '../services/auth.service.js';
import { getAuthUser } from '../plugins/auth.plugin.js';
import type { GoogleTokenResponse, GoogleUserInfo } from '../types/oauth.types.js';
import type { UserRole } from '../types/user.types.js';
import { toPublicUser } from '../utils/user.utils.js';

const hashPassword = (password: string): string =>
  createHash('sha256').update(`${CONFIG.JWT_SECRET}:${password}`).digest('hex');

const safeEqual = (a: string, b: string): boolean => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
};

const str = (value: unknown): string => (typeof value === 'string' ? value : '');

const clientIp = (request: FastifyRequest): string | null => {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() ?? null;
  }
  return request.ip ?? null;
};

const googleOAuthConfigured = (): boolean =>
  Boolean(CONFIG.GOOGLE_CLIENT_ID && CONFIG.GOOGLE_CLIENT_SECRET);

const wantsJsonResponse = (request: FastifyRequest): boolean => {
  const query = request.query as Record<string, unknown>;
  if (str(query[QUERY_PARAM_FORMAT]) === RESPONSE_FORMAT_JSON) return true;
  const accept = request.headers.accept ?? '';
  return accept.includes('application/json');
};

const issueToken = async (
  request: FastifyRequest,
  reply: FastifyReply,
  userId: string,
  email: string,
  role: UserRole,
  action: string,
): Promise<string> => {
  const token = await reply.jwtSign({ userId, email, role });
  await createSession({
    userId,
    token,
    expiresAt: buildSessionExpiry(),
  });
  await insertAuditLog({
    userId,
    action,
    resource: AUDIT_RESOURCE_AUTH,
    ipAddress: clientIp(request),
  });
  return token;
};

const redirectOrJson = (
  request: FastifyRequest,
  reply: FastifyReply,
  token: string,
  user: ReturnType<typeof toPublicUser>,
) => {
  if (wantsJsonResponse(request)) {
    return reply.send({ user, token });
  }
  const portalUrl = new URL(PORTAL_OAUTH_CALLBACK_PATH, CONFIG.CORS_ORIGIN);
  portalUrl.searchParams.set(QUERY_PARAM_TOKEN, token);
  return reply.redirect(portalUrl.toString());
};

export const register = async (request: FastifyRequest, reply: FastifyReply) => {
  const body = (request.body ?? {}) as Record<string, unknown>;
  const email = str(body.email);
  const name = str(body.name);
  const password = str(body.password);
  if (!email || !name || !password) {
    return reply.code(400).send({ error: 'email, name, password required' });
  }
  const existing = await findUserByEmail(email);
  if (existing) return reply.code(409).send({ error: 'email already registered' });

  const user = await registerPasswordUser({
    email,
    name,
    passwordHash: hashPassword(password),
  });
  const token = await issueToken(request, reply, user.id, user.email, user.role, 'auth.register');
  return reply.send({ user: toPublicUser(user), token });
};

export const login = async (request: FastifyRequest, reply: FastifyReply) => {
  const body = (request.body ?? {}) as Record<string, unknown>;
  const email = str(body.email);
  const password = str(body.password);
  if (!email || !password) {
    return reply.code(400).send({ error: 'email and password required' });
  }
  const user = await findUserByEmail(email);
  if (!user?.passwordHash || !safeEqual(user.passwordHash, hashPassword(password))) {
    return reply.code(401).send({ error: 'invalid credentials' });
  }
  const token = await issueToken(request, reply, user.id, user.email, user.role, 'auth.login');
  return reply.send({ user: toPublicUser(user), token });
};

export const me = async (request: FastifyRequest, reply: FastifyReply) => {
  const auth = getAuthUser(request);
  if (!auth?.email) return reply.code(401).send({ error: 'unauthorized' });
  const user = await findUserByEmail(auth.email);
  if (!user) return reply.code(404).send({ error: 'not found' });
  return reply.send({ user: toPublicUser(user) });
};

export const startGoogleOAuth = async (_request: FastifyRequest, reply: FastifyReply) => {
  const state = randomBytes(OAUTH_STATE_BYTES).toString('hex');
  const url = new URL(OAUTH_GOOGLE_AUTH_URL);
  url.searchParams.set('client_id', CONFIG.GOOGLE_CLIENT_ID);
  url.searchParams.set('redirect_uri', `${CONFIG.OAUTH_CALLBACK_BASE}/api/auth/google/callback`);
  url.searchParams.set('response_type', OAUTH_RESPONSE_TYPE_CODE);
  url.searchParams.set('scope', OAUTH_GOOGLE_SCOPE);
  url.searchParams.set('state', state);
  return reply.send({ url: url.toString(), state, stub: !googleOAuthConfigured() });
};

export const startGithubOAuth = async (_request: FastifyRequest, reply: FastifyReply) => {
  const state = randomBytes(OAUTH_STATE_BYTES).toString('hex');
  const url = new URL(OAUTH_GITHUB_AUTH_URL);
  url.searchParams.set('client_id', CONFIG.GITHUB_CLIENT_ID);
  url.searchParams.set('redirect_uri', `${CONFIG.OAUTH_CALLBACK_BASE}/api/auth/github/callback`);
  url.searchParams.set('scope', OAUTH_GITHUB_SCOPE);
  url.searchParams.set('state', state);
  return reply.send({ url: url.toString(), state, stub: !CONFIG.GITHUB_CLIENT_ID });
};

const oauthCallbackStub = async (
  request: FastifyRequest,
  reply: FastifyReply,
  provider: typeof OAUTH_PROVIDER_GOOGLE | typeof OAUTH_PROVIDER_GITHUB,
) => {
  const query = request.query as Record<string, unknown>;
  const email = str(query[QUERY_PARAM_EMAIL]) || `${provider}-user@inkforgejs.com`;
  const name = str(query[QUERY_PARAM_NAME]) || `${provider} user`;
  const providerId = str(query[QUERY_PARAM_ID]) || `${provider}-dev`;
  const user = await findOrCreateOAuthUser({ email, name, provider, providerId });
  const token = await issueToken(
    request,
    reply,
    user.id,
    user.email,
    user.role,
    `auth.oauth.${provider}`,
  );
  return reply.send({
    note: 'Sprint 2 scaffold — exchange real OAuth code for profile in production',
    user: toPublicUser(user),
    token,
  });
};

const exchangeGoogleCode = async (code: string): Promise<GoogleTokenResponse> => {
  const body = new URLSearchParams({
    code,
    client_id: CONFIG.GOOGLE_CLIENT_ID,
    client_secret: CONFIG.GOOGLE_CLIENT_SECRET,
    redirect_uri: `${CONFIG.OAUTH_CALLBACK_BASE}/api/auth/google/callback`,
    grant_type: OAUTH_GRANT_TYPE_AUTHORIZATION_CODE,
  });
  const response = await fetch(OAUTH_GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      [HEADER_CONTENT_TYPE]: CONTENT_TYPE_FORM_URLENCODED,
    },
    body: body.toString(),
    signal: AbortSignal.timeout(OAUTH_FETCH_TIMEOUT_MS),
  });
  return (await response.json()) as GoogleTokenResponse;
};

const fetchGoogleUserInfo = async (accessToken: string): Promise<GoogleUserInfo> => {
  const response = await fetch(OAUTH_GOOGLE_USERINFO_URL, {
    headers: {
      [HEADER_AUTHORIZATION]: `${BEARER_PREFIX}${accessToken}`,
    },
    signal: AbortSignal.timeout(OAUTH_FETCH_TIMEOUT_MS),
  });
  return (await response.json()) as GoogleUserInfo;
};

export const googleCallback = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!googleOAuthConfigured()) {
    return oauthCallbackStub(request, reply, OAUTH_PROVIDER_GOOGLE);
  }

  const query = request.query as Record<string, unknown>;
  const code = str(query[QUERY_PARAM_CODE]);
  if (!code) {
    return reply.code(400).send({ error: 'code required' });
  }

  try {
    const tokenResponse = await exchangeGoogleCode(code);
    if (!tokenResponse.access_token) {
      return reply.code(401).send({
        error: 'google token exchange failed',
        details: tokenResponse.error_description ?? tokenResponse.error ?? null,
      });
    }

    const profile = await fetchGoogleUserInfo(tokenResponse.access_token);
    const email = str(profile.email);
    const providerId = str(profile.sub);
    if (!email || !providerId) {
      return reply.code(401).send({ error: 'google userinfo missing email or sub' });
    }

    const name = str(profile.name) || email;
    const user = await findOrCreateOAuthUser({
      email,
      name,
      provider: OAUTH_PROVIDER_GOOGLE,
      providerId,
    });
    const token = await issueToken(
      request,
      reply,
      user.id,
      user.email,
      user.role,
      `auth.oauth.${OAUTH_PROVIDER_GOOGLE}`,
    );
    return redirectOrJson(request, reply, token, toPublicUser(user));
  } catch {
    return reply.code(502).send({ error: 'google oauth request failed' });
  }
};

export const githubCallback = async (request: FastifyRequest, reply: FastifyReply) =>
  oauthCallbackStub(request, reply, OAUTH_PROVIDER_GITHUB);
