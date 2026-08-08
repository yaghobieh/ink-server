import { getSql, firstRow } from '../db/index.js';
import type { AuditLogRecord } from '../types/audit.types.js';

type AuditRow = {
  id: string;
  user_id: string | null;
  action: string;
  resource: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string | Date;
};

const mapAudit = (row: AuditRow): AuditLogRecord => ({
  id: row.id,
  userId: row.user_id,
  action: row.action,
  resource: row.resource,
  metadata: row.metadata ?? {},
  ipAddress: row.ip_address,
  createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
});

export const insertAuditLog = async (input: {
  userId?: string | null;
  action: string;
  resource?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}): Promise<void> => {
  const sql = getSql();
  await sql`
    INSERT INTO audit_logs (user_id, action, resource, metadata, ip_address)
    VALUES (
      ${input.userId ?? null},
      ${input.action},
      ${input.resource ?? null},
      ${JSON.stringify(input.metadata ?? {})},
      ${input.ipAddress ?? null}
    )
  `;
};

export const listAuditLogs = async (input: {
  userId?: string | null;
  limit: number;
  offset: number;
}): Promise<{ items: AuditLogRecord[]; total: number }> => {
  const sql = getSql();

  const countRows = input.userId
    ? await sql`
        SELECT COUNT(*)::int AS total
        FROM audit_logs
        WHERE user_id = ${input.userId}
      `
    : await sql`
        SELECT COUNT(*)::int AS total
        FROM audit_logs
      `;

  const totalRow = firstRow<{ total: number }>(countRows);
  const total = totalRow?.total ?? 0;

  const rows = input.userId
    ? await sql`
        SELECT id, user_id, action, resource, metadata, ip_address, created_at
        FROM audit_logs
        WHERE user_id = ${input.userId}
        ORDER BY created_at DESC
        LIMIT ${input.limit}
        OFFSET ${input.offset}
      `
    : await sql`
        SELECT id, user_id, action, resource, metadata, ip_address, created_at
        FROM audit_logs
        ORDER BY created_at DESC
        LIMIT ${input.limit}
        OFFSET ${input.offset}
      `;

  return {
    items: (rows as AuditRow[]).map(mapAudit),
    total,
  };
};
