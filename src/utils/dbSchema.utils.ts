import { neon } from '@neondatabase/serverless';
import { DB_DRIVER } from '../const/install.const.js';
import type { DbDriver } from './dbPing.utils.js';

export type DatabaseTableInfo = {
  name: string;
  rowCount: number;
  columns: string[];
};

type TableNameRow = { name: string };
type TableCountRow = { name: string; rows: number | string };
type TableColumnRow = { name: string; column: string };

export const listPostgresTables = async (
  connectionString: string,
): Promise<DatabaseTableInfo[]> => {
  const sql = neon(connectionString);
  const tableRows = (await sql`
    SELECT table_name AS name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `) as TableNameRow[];
  const countRows = (await sql`
    SELECT relname AS name, n_live_tup AS rows
    FROM pg_stat_user_tables
  `) as TableCountRow[];
  const columnRows = (await sql`
    SELECT table_name AS name, column_name AS column
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `) as TableColumnRow[];
  const counts = new Map(
    countRows.map((row) => [row.name, Number(row.rows) || 0]),
  );
  const columns = new Map<string, string[]>();
  for (const row of columnRows) {
    const current = columns.get(row.name) ?? [];
    current.push(row.column);
    columns.set(row.name, current);
  }
  return tableRows.map((row) => ({
    name: row.name,
    rowCount: counts.get(row.name) ?? 0,
    columns: columns.get(row.name) ?? [],
  }));
};

export const listDatabaseTables = async (
  driver: DbDriver,
  connectionString: string,
): Promise<DatabaseTableInfo[]> => {
  if (driver !== DB_DRIVER.POSTGRES) return [];
  try {
    return await listPostgresTables(connectionString);
  } catch {
    return [];
  }
};
