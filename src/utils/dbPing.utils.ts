import net from 'node:net';
import { neon } from '@neondatabase/serverless';
import {
  DB_PING_TIMEOUT_MS,
  MONGO_DEFAULT_PORT,
  POSTGRES_DEFAULT_PORT,
} from '../const/numbers.const.js';
import { DB_DRIVER } from '../const/install.const.js';

export type DbDriver = (typeof DB_DRIVER)[keyof typeof DB_DRIVER];

const MONGO_SRV_PREFIX = 'mongodb+srv://';
const MONGO_PREFIX = 'mongodb://';
const POSTGRES_PREFIXES = ['postgres://', 'postgresql://'];

const toHttpUrl = (connectionString: string): URL | null => {
  const trimmed = connectionString.trim();
  if (!trimmed) return null;
  const normalized = trimmed
    .replace(MONGO_SRV_PREFIX, 'https://')
    .replace(MONGO_PREFIX, 'http://');
  try {
    return new URL(normalized);
  } catch {
    try {
      return new URL(trimmed);
    } catch {
      return null;
    }
  }
};

export const resolveDbDriver = (
  storedDriver: string | undefined,
  connectionString: string,
): DbDriver => {
  const url = connectionString.trim().toLowerCase();
  if (url.startsWith('mongodb')) return DB_DRIVER.MONGO;
  if (POSTGRES_PREFIXES.some((prefix) => url.startsWith(prefix))) return DB_DRIVER.POSTGRES;
  if (storedDriver === DB_DRIVER.MONGO) return DB_DRIVER.MONGO;
  return DB_DRIVER.POSTGRES;
};

export const parseDbHost = (connectionString: string): string => {
  const parsed = toHttpUrl(connectionString);
  if (!parsed) return '';
  return parsed.host;
};

const pingTcp = (host: string, port: number, timeoutMs: number): Promise<boolean> =>
  new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, timeoutMs);
    socket.once('connect', () => {
      clearTimeout(timer);
      socket.end();
      resolve(true);
    });
    socket.once('error', () => {
      clearTimeout(timer);
      socket.destroy();
      resolve(false);
    });
  });

const pingPostgres = async (databaseUrl: string): Promise<boolean> => {
  try {
    const sql = neon(databaseUrl);
    const rows = await sql`SELECT 1 AS ok`;
    if (Array.isArray(rows) && rows.length > 0) return true;
  } catch {
    const parsed = toHttpUrl(databaseUrl);
    if (!parsed?.hostname) return false;
    const port = parsed.port ? Number(parsed.port) : POSTGRES_DEFAULT_PORT;
    return pingTcp(parsed.hostname, port || POSTGRES_DEFAULT_PORT, DB_PING_TIMEOUT_MS);
  }
  const parsed = toHttpUrl(databaseUrl);
  if (!parsed?.hostname) return false;
  const port = parsed.port ? Number(parsed.port) : POSTGRES_DEFAULT_PORT;
  return pingTcp(parsed.hostname, port || POSTGRES_DEFAULT_PORT, DB_PING_TIMEOUT_MS);
};

const pingMongo = async (connectionString: string): Promise<boolean> => {
  const parsed = toHttpUrl(connectionString);
  if (!parsed?.hostname) return false;
  const port = parsed.port
    ? Number(parsed.port)
    : MONGO_DEFAULT_PORT;
  return pingTcp(parsed.hostname, port || MONGO_DEFAULT_PORT, DB_PING_TIMEOUT_MS);
};

export const pingDatabase = async (
  driver: DbDriver,
  connectionString: string,
): Promise<boolean> => {
  if (driver === DB_DRIVER.MONGO) {
    return pingMongo(connectionString);
  }
  return pingPostgres(connectionString);
};

export const postgresDefaultPort = POSTGRES_DEFAULT_PORT;
