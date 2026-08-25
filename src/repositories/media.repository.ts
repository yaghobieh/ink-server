import { firstRow, getSql } from '../db/index.js';
import type { CmsMediaRecord } from '../types/content.types.js';

type MediaRow = {
  id: string;
  public_id: string;
  url: string;
  secure_url: string;
  resource_type: string;
  format: string | null;
  bytes: number;
  width: number | null;
  height: number | null;
  folder: string | null;
  created_at: string | Date;
};

const toIso = (value: string | Date): string =>
  value instanceof Date ? value.toISOString() : value;

const mapMedia = (row: MediaRow): CmsMediaRecord => ({
  id: row.id,
  publicId: row.public_id,
  url: row.url,
  secureUrl: row.secure_url,
  resourceType: row.resource_type,
  format: row.format,
  bytes: row.bytes,
  width: row.width,
  height: row.height,
  folder: row.folder,
  createdAt: toIso(row.created_at),
});

export const countMedia = async (): Promise<number> => {
  const sql = getSql();
  const rows = await sql`SELECT COUNT(*)::int AS count FROM cms_media`;
  return Number(firstRow<{ count: number }>(rows)?.count ?? 0);
};

export const listMedia = async (): Promise<CmsMediaRecord[]> => {
  const sql = getSql();
  const rows = await sql`
    SELECT id, public_id, url, secure_url, resource_type, format, bytes, width, height, folder, created_at
    FROM cms_media
    ORDER BY created_at DESC
  `;
  return (rows as MediaRow[]).map(mapMedia);
};

export const upsertMedia = async (input: {
  publicId: string;
  url: string;
  secureUrl: string;
  resourceType: string;
  format?: string | null;
  bytes?: number;
  width?: number | null;
  height?: number | null;
  folder?: string | null;
}): Promise<CmsMediaRecord> => {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO cms_media (
      public_id, url, secure_url, resource_type, format, bytes, width, height, folder
    )
    VALUES (
      ${input.publicId},
      ${input.url},
      ${input.secureUrl},
      ${input.resourceType},
      ${input.format ?? null},
      ${input.bytes ?? 0},
      ${input.width ?? null},
      ${input.height ?? null},
      ${input.folder ?? null}
    )
    ON CONFLICT (public_id)
    DO UPDATE SET
      url = EXCLUDED.url,
      secure_url = EXCLUDED.secure_url,
      resource_type = EXCLUDED.resource_type,
      format = EXCLUDED.format,
      bytes = EXCLUDED.bytes,
      width = EXCLUDED.width,
      height = EXCLUDED.height,
      folder = EXCLUDED.folder
    RETURNING id, public_id, url, secure_url, resource_type, format, bytes, width, height, folder, created_at
  `;
  const row = firstRow<MediaRow>(rows);
  if (!row) throw new Error('failed to upsert media');
  return mapMedia(row);
};
