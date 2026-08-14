import { getSql } from '../db/client.js';

const run = async () => {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS cms_pages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      body_html TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
      media_url TEXT,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS cms_pages_status_idx ON cms_pages (status)`;
  await sql`CREATE INDEX IF NOT EXISTS cms_pages_updated_at_idx ON cms_pages (updated_at DESC)`;

  await sql`
    INSERT INTO cms_pages (slug, title, body_html, status)
    VALUES
      (
        'home',
        'Ink home',
        '<p>Welcome to Ink CMS. Edit portal copy and media from here.</p>',
        'published'
      ),
      (
        'docs-plugins',
        'Plugins docs',
        '<p>Drag-drop .ink packages and npm plugins.</p>',
        'published'
      )
    ON CONFLICT (slug) DO NOTHING
  `;

  console.log('cms pages migration applied');
};

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
