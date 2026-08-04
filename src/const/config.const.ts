import 'dotenv/config';
import { DEFAULT_PORT } from './numbers.const.js';

export const CONFIG = {
  PORT: Number(process.env.PORT ?? DEFAULT_PORT),
  MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/ink',
  JWT_SECRET: process.env.JWT_SECRET ?? 'dev-only-change-me',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? '',
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ?? '',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ?? '',
  OAUTH_CALLBACK_BASE: process.env.OAUTH_CALLBACK_BASE ?? 'http://localhost:4000',
} as const;
