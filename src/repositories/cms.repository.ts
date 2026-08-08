import { firstRow, getSql } from '../db/index.js';
import type { CmsPageRecord, CmsPageStatus } from '../types/cms.types.js';

type CmsPageRow = {
  id: string;
  slug: string;
  title: string;
  body_html: string;
  status: CmsPageStatus;
  media_url: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type CmsCountRow = {
  total: number;
  published: number;
  draft: number;
};

const toIso = (value: string | Date): string =>
  value instanceof Date ? value.toISOString() : value;

const mapPage = (row: CmsPageRow): CmsPageRecord => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  bodyHtml: row.body_html,
  status: row.status,
  mediaUrl: row.media_url,
  createdBy: row.created_by,
  updatedBy: row.updated_by,
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
});

export const listCmsPages = async (): Promise<CmsPageRecord[]> => {
  const sql = getSql();
  const rows = await sql`
    SELECT id, slug, title, body_html, status, media_url, created_by, updated_by, created_at, updated_at
    FROM cms_pages
    ORDER BY updated_at DESC
  `;
  return (rows as CmsPageRow[]).map(mapPage);
};

export const countCmsPagesByStatus = async (): Promise<{
  total: number;
  published: number;
  draft: number;
}> => {
  const sql = getSql();
  const rows = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'published')::int AS published,
      COUNT(*) FILTER (WHERE status = 'draft')::int AS draft
    FROM cms_pages
  `;
  const row = firstRow<CmsCountRow>(rows);
  return {
    total: row?.total ?? 0,
    published: row?.published ?? 0,
    draft: row?.draft ?? 0,
  };
};

export const createCmsPage = async (input: {
  slug: string;
  title: string;
  bodyHtml: string;
  status: CmsPageStatus;
  mediaUrl?: string | null;
  userId: string;
}): Promise<CmsPageRecord> => {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO cms_pages (slug, title, body_html, status, media_url, created_by, updated_by)
    VALUES (
      ${input.slug},
      ${input.title},
      ${input.bodyHtml},
      ${input.status},
      ${input.mediaUrl ?? null},
      ${input.userId},
      ${input.userId}
    )
    RETURNING id, slug, title, body_html, status, media_url, created_by, updated_by, created_at, updated_at
  `;
  const row = firstRow<CmsPageRow>(rows);
  if (!row) throw new Error('failed to create cms page');
  return mapPage(row);
};

export const updateCmsPage = async (input: {
  id: string;
  title: string;
  bodyHtml: string;
  status: CmsPageStatus;
  mediaUrl?: string | null;
  userId: string;
}): Promise<CmsPageRecord | null> => {
  const sql = getSql();
  const rows = await sql`
    UPDATE cms_pages
    SET
      title = ${input.title},
      body_html = ${input.bodyHtml},
      status = ${input.status},
      media_url = ${input.mediaUrl ?? null},
      updated_by = ${input.userId},
      updated_at = NOW()
    WHERE id = ${input.id}
    RETURNING id, slug, title, body_html, status, media_url, created_by, updated_by, created_at, updated_at
  `;
  const row = firstRow<CmsPageRow>(rows);
  return row ? mapPage(row) : null;
};
