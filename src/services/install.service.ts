import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  INSTALL_ASSETS_DIR,
  INSTALL_CONFIG_DIR,
  INSTALL_CONFIG_ENV,
  INSTALL_CONFIG_JSON,
  INSTALL_STEP_IDS,
  INSTALL_STEP_LABELS,
  MEDIA_STORAGE,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  AI_SKIPPED,
  TEMPLATE_BLANK,
} from '../const/install.const.js';
import { CONFIG } from '../const/index.js';
import { MCP_TOOL_NAMES } from '../const/cms.const.js';
import { ensureCrewTables, upsertInstallAdmin } from '../repositories/crew.repository.js';
import type {
  InstallRequestBody,
  InstallStatusResponse,
  InstallStepResult,
  InstallStoredConfig,
} from '../types/install.types.js';
import {
  parseDbHost,
  pingDatabase,
  resolveDbDriver,
} from '../utils/dbPing.utils.js';
import { listDatabaseTables } from '../utils/dbSchema.utils.js';
import { seedDocumentPages } from './docsSeed.service.js';
import { writeExtendApiMarker } from '../utils/extendApi.utils.js';
import { cloneGitPlugin } from '../utils/gitPlugin.utils.js';
import { resolveTemplateFromAiPrompt } from '../utils/installAi.utils.js';

import { neon } from '@neondatabase/serverless';

const rootDir = process.cwd();

const configDirPath = () => path.join(rootDir, INSTALL_CONFIG_DIR);
const configJsonPath = () => path.join(configDirPath(), INSTALL_CONFIG_JSON);
const configEnvPath = () => path.join(configDirPath(), INSTALL_CONFIG_ENV);
const assetsDirPath = () => path.join(rootDir, INSTALL_ASSETS_DIR);

const toPublicConfig = (
  config: InstallStoredConfig,
): Omit<InstallStoredConfig, 'connectionString'> => {
  const { connectionString: _hidden, ...rest } = config;
  return rest;
};

const buildConnectionString = (body: InstallRequestBody): string => {
  if (typeof body.connectionString === 'string' && body.connectionString.trim()) {
    return body.connectionString.trim();
  }
  const connection = body.connection;
  if (!connection) return '';
  const scheme = body.dbDriver === 'mongo' ? 'mongodb' : 'postgresql';
  const user = encodeURIComponent(connection.user);
  const password = encodeURIComponent(connection.password);
  return `${scheme}://${user}:${password}@${connection.host}:${connection.port}/${connection.database}`;
};

const hashPassword = (password: string): string =>
  createHash('sha256').update(`${CONFIG.JWT_SECRET}:${password}`).digest('hex');

const ensureAuthTables = async (databaseUrl: string): Promise<void> => {
  const sql = neon(databaseUrl);
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT,
      provider TEXT NOT NULL DEFAULT 'password',
      provider_id TEXT,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'crm_admin')),
      username TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT`;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique_idx
    ON users (username)
    WHERE username IS NOT NULL
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'ai')),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
};

const ensureCmsTables = async (databaseUrl: string): Promise<void> => {
  const sql = neon(databaseUrl);
  await sql`
    CREATE TABLE IF NOT EXISTS cms_content (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      collection TEXT NOT NULL,
      slug TEXT NOT NULL,
      locale TEXT NOT NULL DEFAULT 'en',
      title TEXT NOT NULL DEFAULT '',
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (collection, slug, locale)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS cms_content_collection_idx ON cms_content (collection)`;
  await sql`
    CREATE TABLE IF NOT EXISTS cms_pages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL DEFAULT '',
      body_html TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      media_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
};

const seedBlankDoc = async (
  databaseUrl: string,
  projectName: string,
): Promise<void> => {
  const sql = neon(databaseUrl);
  const title = `${projectName} installation`;
  const html = `<p>Welcome to ${projectName}. Edit this page in CMS — it is live from Neon.</p>`;
  const payloadJson = JSON.stringify({
    labelKey: 'tocInstallation',
    html,
    blocks: [{ type: 'html', html }],
  });
  await sql`
    INSERT INTO cms_content (collection, slug, locale, title, payload, status)
    VALUES (
      'docs',
      'installation',
      'en',
      ${title},
      ${payloadJson}::jsonb,
      'published'
    )
    ON CONFLICT (collection, slug, locale) DO UPDATE
    SET
      title = EXCLUDED.title,
      payload = EXCLUDED.payload,
      status = EXCLUDED.status,
      updated_at = NOW()
  `;
};

const writeEnvFile = async (stored: InstallStoredConfig, connectionString: string): Promise<void> => {
  const lines = [
    `# Generated by Bifrost installment ${stored.installedAt}`,
    `PROJECT_NAME=${stored.projectName}`,
    `DATABASE_URL=${connectionString}`,
    `BIFROST_DB_DRIVER=${stored.dbDriver}`,
    `BIFROST_PRIMARY_COLOR=${stored.primaryColor}`,
    `BIFROST_SECONDARY_COLOR=${stored.secondaryColor}`,
    `BIFROST_MEDIA_STORAGE=${stored.mediaStorage}`,
    `BIFROST_MCP_ENABLED=${stored.mcp.enabled ? 'true' : 'false'}`,
    `BIFROST_LIVE_CONNECTION_AUDIT=${stored.liveConnectionAudit ? 'true' : 'false'}`,
  ];
  if (stored.siteName) lines.push(`SITE_NAME=${stored.siteName}`);
  if (stored.siteUrl) lines.push(`SITE_URL=${stored.siteUrl}`);
  if (stored.cloudinary?.cloudName) {
    lines.push(`CLOUDINARY_CLOUD_NAME=${stored.cloudinary.cloudName}`);
  }
  if (stored.mcp.apiKeyEnvVar) {
    lines.push(`MCP_API_KEY_ENV=${stored.mcp.apiKeyEnvVar}`);
  }
  if (stored.admin?.email) lines.push(`SEED_ADMIN_EMAIL=${stored.admin.email}`);
  if (stored.admin?.username) lines.push(`SEED_ADMIN_USERNAME=${stored.admin.username}`);
  if (stored.admin?.name) lines.push(`SEED_ADMIN_NAME=${stored.admin.name}`);
  if (stored.extendApi) lines.push('BIFROST_EXTEND_API=true');
  if (stored.gitRepoUrl) lines.push(`BIFROST_GIT_PLUGIN=${stored.gitRepoUrl}`);
  if (stored.aiPrompt) lines.push(`BIFROST_AI_PROMPT=${stored.aiPrompt.replace(/\n/g, ' ')}`);
  await writeFile(configEnvPath(), `${lines.join('\n')}\n`, 'utf8');
};

const toStoredConfig = (
  body: InstallRequestBody,
  connectionString: string,
): InstallStoredConfig => {
  const mediaStorage = body.mediaStorage ?? MEDIA_STORAGE.CLOUDINARY;
  return {
    projectName: body.projectName.trim(),
    dbDriver: body.dbDriver,
    connectionString,
    liveConnectionAudit: Boolean(body.liveConnectionAudit),
    templateId: body.templateId ?? 'blank',
    primaryColor: body.primaryColor ?? DEFAULT_PRIMARY_COLOR,
    secondaryColor: body.secondaryColor ?? DEFAULT_SECONDARY_COLOR,
    siteName: body.siteName,
    siteUrl: body.siteUrl,
    admin: {
      email: body.admin?.email?.trim() || CONFIG.SEED_ADMIN_EMAIL,
      username: body.admin?.username?.trim() || CONFIG.SEED_ADMIN_USERNAME,
      name: body.admin?.name?.trim() || CONFIG.SEED_ADMIN_NAME,
      role: body.admin?.role ?? 'admin',
      passwordSet: Boolean(body.admin?.password || CONFIG.SEED_ADMIN_PASSWORD),
    },
    mediaStorage,
    cloudinary: body.cloudinary
      ? {
          cloudName: body.cloudinary.cloudName,
          configured: Boolean(body.cloudinary.apiKey && body.cloudinary.apiSecret),
        }
      : undefined,
    mcp: {
      enabled: body.mcp?.enabled ?? true,
      apiKeyEnvVar: body.mcp?.apiKeyEnvVar ?? 'MCP_API_KEY',
    },
    extendApi: Boolean(body.extendApi),
    gitRepoUrl: body.gitRepoUrl?.trim() || undefined,
    aiPrompt: body.aiPrompt?.trim() || undefined,
    installedAt: new Date().toISOString(),
    configPath: configJsonPath(),
    envPath: configEnvPath(),
  };
};

export const readInstallConfig = async (): Promise<InstallStoredConfig | null> => {
  try {
    const raw = await readFile(configJsonPath(), 'utf8');
    return JSON.parse(raw) as InstallStoredConfig;
  } catch {
    return null;
  }
};

export const getInstallStatus = async (): Promise<InstallStatusResponse> => {
  const emptyTables: InstallStatusResponse['tables'] = [];
  const mcpTools = [...MCP_TOOL_NAMES];
  const config = await readInstallConfig();
  if (!config) {
    return {
      installed: false,
      live: false,
      dbDriver: null,
      dbHost: '',
      config: null,
      tables: emptyTables,
      mcpTools,
    };
  }
  const connectionString = config.connectionString || CONFIG.DATABASE_URL;
  const dbDriver = resolveDbDriver(config.dbDriver, connectionString);
  const dbHost = parseDbHost(connectionString);
  try {
    const live = await pingDatabase(dbDriver, connectionString);
    const tables = live
      ? await listDatabaseTables(dbDriver, connectionString)
      : emptyTables;
    return {
      installed: true,
      live,
      dbDriver,
      dbHost,
      config: toPublicConfig(config),
      tables,
      mcpTools,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'database unreachable';
    return {
      installed: true,
      live: false,
      dbDriver,
      dbHost,
      config: toPublicConfig(config),
      tables: emptyTables,
      mcpTools,
      error: message,
    };
  }
};

export const runInstall = async (
  body: InstallRequestBody,
): Promise<{ ok: boolean; steps: InstallStepResult[]; config: InstallStoredConfig | null; error?: string }> => {
  const steps: InstallStepResult[] = [];
  const push = (id: (typeof INSTALL_STEP_IDS)[number], ok: boolean, detail?: string) => {
    steps.push({ id, label: INSTALL_STEP_LABELS[id], ok, detail });
  };

  const projectName = typeof body.projectName === 'string' ? body.projectName.trim() : '';
  if (!projectName) {
    push('validate-config', false, 'projectName required');
    return { ok: false, steps, config: null, error: 'projectName required' };
  }
  if (body.dbDriver !== 'postgres') {
    push('validate-config', false, 'only postgres is supported in 1.1.7');
    return { ok: false, steps, config: null, error: 'only postgres is supported' };
  }

  const connectionString = buildConnectionString(body);
  if (!connectionString) {
    push('validate-config', false, 'connectionString required');
    return { ok: false, steps, config: null, error: 'connectionString required' };
  }
  push('validate-config', true);

  if (body.aiPrompt?.trim()) {
    body.templateId = resolveTemplateFromAiPrompt(
      body.aiPrompt,
      body.templateId ?? TEMPLATE_BLANK,
    );
  }

  try {
    const live = await pingDatabase(
      resolveDbDriver(body.dbDriver, connectionString),
      connectionString,
    );
    if (!live) {
      push('ping-database', false, 'database ping failed');
      return { ok: false, steps, config: null, error: 'database ping failed' };
    }
    push('ping-database', true);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'ping failed';
    push('ping-database', false, message);
    return { ok: false, steps, config: null, error: message };
  }

  await mkdir(configDirPath(), { recursive: true });
  if ((body.mediaStorage ?? MEDIA_STORAGE.CLOUDINARY) === MEDIA_STORAGE.LOCAL) {
    await mkdir(assetsDirPath(), { recursive: true });
  }

  const stored = toStoredConfig(body, connectionString);
  try {
    await writeFile(configJsonPath(), `${JSON.stringify(stored, null, 2)}\n`, 'utf8');
    await writeEnvFile(stored, connectionString);
    push('write-env', true, configEnvPath());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'write failed';
    push('write-env', false, message);
    return { ok: false, steps, config: null, error: message };
  }

  try {
    await ensureAuthTables(connectionString);
    await ensureCmsTables(connectionString);
    const sql = neon(connectionString);
    await ensureCrewTables(sql);
    push('create-tables', true);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'migrate failed';
    push('create-tables', false, message);
    return { ok: false, steps, config: stored, error: message };
  }

  try {
    const adminEmail = body.admin?.email?.trim() || CONFIG.SEED_ADMIN_EMAIL;
    const adminUsername = body.admin?.username?.trim() || CONFIG.SEED_ADMIN_USERNAME;
    const adminName = body.admin?.name?.trim() || CONFIG.SEED_ADMIN_NAME || adminUsername;
    const adminPassword = body.admin?.password || CONFIG.SEED_ADMIN_PASSWORD;
    if (!adminEmail || !adminUsername || !adminPassword) {
      push('create-admin', false, 'admin email, username, and password required');
      return { ok: false, steps, config: stored, error: 'first admin required' };
    }
    const sql = neon(connectionString);
    await upsertInstallAdmin(sql, {
      email: adminEmail,
      name: adminName,
      username: adminUsername,
      passwordHash: hashPassword(adminPassword),
    });
    push('create-admin', true, adminEmail);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'admin failed';
    push('create-admin', false, message);
    return { ok: false, steps, config: stored, error: message };
  }

  try {
    if (stored.templateId === 'docs-portal') {
      const seeded = await seedDocumentPages(connectionString);
      push('seed-template', true, `${stored.templateId}:${seeded}`);
    } else if (stored.templateId === 'blank') {
      await seedBlankDoc(connectionString, stored.projectName);
      push('seed-template', true, stored.templateId);
    } else {
      push('seed-template', true, stored.templateId);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'seed failed';
    push('seed-template', false, message);
    return { ok: false, steps, config: stored, error: message };
  }

  push('theme-colors', true, `${stored.primaryColor} / ${stored.secondaryColor}`);

  try {
    const apiPath = await writeExtendApiMarker(rootDir, Boolean(body.extendApi));
    push('generate-api', true, apiPath);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'extend api failed';
    push('generate-api', false, message);
    return { ok: false, steps, config: stored, error: message };
  }

  try {
    const cloned = await cloneGitPlugin(body.gitRepoUrl, rootDir);
    push('clone-git', true, cloned);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'git clone failed';
    push('clone-git', false, message);
    return { ok: false, steps, config: stored, error: message };
  }

  try {
    const prompt = body.aiPrompt?.trim() ?? '';
    if (!prompt) {
      push('apply-ai', true, AI_SKIPPED);
    } else {
      const resolved = resolveTemplateFromAiPrompt(prompt, stored.templateId);
      stored.templateId = resolved;
      stored.aiPrompt = prompt;
      await writeFile(configJsonPath(), `${JSON.stringify(stored, null, 2)}\n`, 'utf8');
      push('apply-ai', true, resolved);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'ai failed';
    push('apply-ai', false, message);
    return { ok: false, steps, config: stored, error: message };
  }

  push('complete', true);

  return { ok: true, steps, config: stored };
};
