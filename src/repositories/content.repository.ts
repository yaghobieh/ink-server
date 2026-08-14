import { firstRow, getSql } from '../db/index.js';
import type { CmsContentRecord, CmsContentStatus } from '../types/content.types.js';

type ContentRow = {
  id: string;
  collection: string;
  slug: string;
  locale: string;
  title: string;
  payload: Record<string, unknown> | string;
  status: CmsContentStatus;
  created_at: string | Date;
  updated_at: string | Date;
};

const toIso = (value: string | Date): string =>
  value instanceof Date ? value.toISOString() : value;

const mapContent = (row: ContentRow): CmsContentRecord => ({
  id: row.id,
  collection: row.collection,
  slug: row.slug,
  locale: row.locale,
  title: row.title,
  payload:
    typeof row.payload === 'string'
      ? (JSON.parse(row.payload) as Record<string, unknown>)
      : row.payload,
  status: row.status,
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
});

export const listContent = async (collection?: string): Promise<CmsContentRecord[]> => {
  const sql = getSql();
  if (collection) {
    const rows = await sql`
      SELECT id, collection, slug, locale, title, payload, status, created_at, updated_at
      FROM cms_content
      WHERE collection = ${collection}
      ORDER BY updated_at DESC
    `;
    return (rows as ContentRow[]).map(mapContent);
  }
  const rows = await sql`
    SELECT id, collection, slug, locale, title, payload, status, created_at, updated_at
    FROM cms_content
    ORDER BY collection ASC, updated_at DESC
  `;
  return (rows as ContentRow[]).map(mapContent);
};

export const listPublishedContent = async (
  collection: string,
  locale = 'en',
): Promise<CmsContentRecord[]> => {
  const sql = getSql();
  const rows = await sql`
    SELECT id, collection, slug, locale, title, payload, status, created_at, updated_at
    FROM cms_content
    WHERE collection = ${collection}
      AND status = 'published'
      AND locale = ${locale}
    ORDER BY slug ASC
  `;
  return (rows as ContentRow[]).map(mapContent);
};

export const getPublishedContentBySlug = async (
  collection: string,
  slug: string,
  locale = 'en',
): Promise<CmsContentRecord | null> => {
  const sql = getSql();
  const rows = await sql`
    SELECT id, collection, slug, locale, title, payload, status, created_at, updated_at
    FROM cms_content
    WHERE collection = ${collection}
      AND slug = ${slug}
      AND status = 'published'
      AND locale = ${locale}
    LIMIT 1
  `;
  const row = firstRow<ContentRow>(rows);
  return row ? mapContent(row) : null;
};

export const upsertContent = async (input: {
  collection: string;
  slug: string;
  locale: string;
  title: string;
  payload: Record<string, unknown>;
  status: CmsContentStatus;
}): Promise<CmsContentRecord> => {
  const sql = getSql();
  const payloadJson = JSON.stringify(input.payload);
  const rows = await sql`
    INSERT INTO cms_content (collection, slug, locale, title, payload, status)
    VALUES (
      ${input.collection},
      ${input.slug},
      ${input.locale},
      ${input.title},
      ${payloadJson}::jsonb,
      ${input.status}
    )
    ON CONFLICT (collection, slug, locale)
    DO UPDATE SET
      title = EXCLUDED.title,
      payload = EXCLUDED.payload,
      status = EXCLUDED.status,
      updated_at = NOW()
    RETURNING id, collection, slug, locale, title, payload, status, created_at, updated_at
  `;
  const row = firstRow<ContentRow>(rows);
  if (!row) throw new Error('failed to upsert content');
  return mapContent(row);
};
