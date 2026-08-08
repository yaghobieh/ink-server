import 'dotenv/config';
import { DEFAULT_PORT } from './numbers.const.js';

export const CONFIG = {
  PORT: Number(process.env.PORT ?? DEFAULT_PORT),
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  JWT_SECRET: process.env.JWT_SECRET ?? 'dev-only-change-me',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? '',
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ?? '',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ?? '',
  OAUTH_CALLBACK_BASE: process.env.OAUTH_CALLBACK_BASE ?? 'http://localhost:4000',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? '',
  SEED_ADMIN_USERNAME: process.env.SEED_ADMIN_USERNAME ?? 'yaghobieh',
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD ?? 'admin123',
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL ?? 'yaghobieh@ink.local',
} as const;
