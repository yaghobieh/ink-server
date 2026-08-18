import { DOCS_COLLECTION, TEMPLATES_COLLECTION } from '../const/cms.const.js';
import { MS_PER_DAY, WEEK_DAY_COUNT } from '../const/numbers.const.js';
import { firstRow, getSql } from '../db/index.js';
import type {
  CmsContentRecord,
  CmsContentStatus,
  ContentCollectionCount,
  ContentStats,
} from '../types/content.types.js';

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

type ContentCountRow = {
  collection: string;
  status: string;
  count: number;
};

type WeeklyCountRow = {
  day: string | Date;
  count: number;
};

const STATUS_PUBLISHED = 'published';
const STATUS_DRAFT = 'draft';
const STATUS_ARCHIVED = 'archived';

export const countContentStats = async (): Promise<ContentStats> => {
  const sql = getSql();
  const rows = (await sql`
    SELECT collection, status, COUNT(*)::int AS count
    FROM cms_content
    GROUP BY collection, status
  `) as ContentCountRow[];
  const collections = new Map<string, ContentCollectionCount>();
  let total = 0;
  let published = 0;
  let draft = 0;
  let archived = 0;
  let docs = 0;
  let templates = 0;
  for (const row of rows) {
    const count = Number(row.count) || 0;
    total += count;
    if (row.status === STATUS_PUBLISHED) published += count;
    if (row.status === STATUS_DRAFT) draft += count;
    if (row.status === STATUS_ARCHIVED) archived += count;
    if (row.collection === DOCS_COLLECTION) docs += count;
    if (row.collection === TEMPLATES_COLLECTION) templates += count;
    const current = collections.get(row.collection) ?? {
      name: row.collection,
      count: 0,
      published: 0,
      draft: 0,
    };
    current.count += count;
    if (row.status === STATUS_PUBLISHED) current.published += count;
    if (row.status === STATUS_DRAFT) current.draft += count;
    collections.set(row.collection, current);
  }
  return {
    total,
    published,
    draft,
    archived,
    docs,
    templates,
    collections: [...collections.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };
};

export const countContentWeekly = async (): Promise<number[]> => {
  const sql = getSql();
  const weekly = Array.from({ length: WEEK_DAY_COUNT }, () => 0);
  const rows = (await sql`
    SELECT updated_at::date AS day, COUNT(*)::int AS count
    FROM cms_content
    WHERE updated_at >= NOW() - INTERVAL '7 days'
    GROUP BY day
  `) as WeeklyCountRow[];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const row of rows) {
    const day = row.day instanceof Date ? row.day : new Date(row.day);
    day.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - day.getTime()) / MS_PER_DAY);
    if (diff >= 0 && diff < WEEK_DAY_COUNT) {
      weekly[WEEK_DAY_COUNT - 1 - diff] = Number(row.count) || 0;
    }
  }
  return weekly;
};

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

export const getContentBySlug = async (
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
      AND locale = ${locale}
    LIMIT 1
  `;
  const row = firstRow<ContentRow>(rows);
  return row ? mapContent(row) : null;
};

export const deleteContent = async (
  collection: string,
  slug: string,
  locale = 'en',
): Promise<boolean> => {
  const sql = getSql();
  const rows = await sql`
    DELETE FROM cms_content
    WHERE collection = ${collection}
      AND slug = ${slug}
      AND locale = ${locale}
    RETURNING id
  `;
  return Array.isArray(rows) && rows.length > 0;
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
