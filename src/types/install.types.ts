import type { MEDIA_STORAGE } from '../const/install.const.js';

export type MediaStorageMode =
  (typeof MEDIA_STORAGE)[keyof typeof MEDIA_STORAGE];

export type InstallAdminUser = {
  email: string;
  username: string;
  password: string;
  name?: string;
  role?: string;
};

export type InstallCloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

export type InstallMcpConfig = {
  enabled: boolean;
  apiKeyEnvVar?: string;
};

export type InstallRequestBody = {
  projectName: string;
  dbDriver: 'postgres' | 'mongo';
  connectionString?: string;
  connection?: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
  liveConnectionAudit?: boolean;
  templateId?: string;
  primaryColor?: string;
  secondaryColor?: string;
  siteName?: string;
  siteUrl?: string;
  admin?: InstallAdminUser;
  mediaStorage?: MediaStorageMode;
  cloudinary?: InstallCloudinaryConfig;
  mcp?: InstallMcpConfig;
  extendApi?: boolean;
  gitRepoUrl?: string;
  aiPrompt?: string;
};

export type InstallStepResult = {
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
};

export type InstallStoredConfig = {
  projectName: string;
  dbDriver: 'postgres' | 'mongo';
  connectionString: string;
  liveConnectionAudit: boolean;
  templateId: string;
  primaryColor: string;
  secondaryColor: string;
  siteName?: string;
  siteUrl?: string;
  admin?: Omit<InstallAdminUser, 'password'> & { passwordSet: boolean };
  mediaStorage: MediaStorageMode;
  cloudinary?: { cloudName: string; configured: boolean };
  mcp: InstallMcpConfig;
  extendApi: boolean;
  gitRepoUrl?: string;
  aiPrompt?: string;
  installedAt: string;
  configPath: string;
  envPath: string;
};

export type InstallStatusResponse = {
  installed: boolean;
  live: boolean;
  dbDriver: 'postgres' | 'mongo' | null;
  dbHost: string;
  config: Omit<InstallStoredConfig, 'connectionString'> | null;
  tables: Array<{ name: string; rowCount: number; columns: string[] }>;
  mcpTools: string[];
  error?: string;
};
