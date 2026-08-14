import { getSql } from '../db/client.js';
import { upsertContent } from '../repositories/content.repository.js';

const run = async () => {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS cms_content (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      collection TEXT NOT NULL,
      slug TEXT NOT NULL,
      locale TEXT NOT NULL DEFAULT 'en',
      title TEXT NOT NULL DEFAULT '',
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (collection, slug, locale)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS cms_content_collection_idx ON cms_content (collection)`;

  await sql`
    CREATE TABLE IF NOT EXISTS cms_media (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      public_id TEXT NOT NULL UNIQUE,
      url TEXT NOT NULL,
      secure_url TEXT NOT NULL,
      resource_type TEXT NOT NULL DEFAULT 'image',
      format TEXT,
      bytes INTEGER NOT NULL DEFAULT 0,
      width INTEGER,
      height INTEGER,
      folder TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS cms_media_created_at_idx ON cms_media (created_at DESC)`;

  await upsertContent({
    collection: 'home',
    slug: 'gallery',
    locale: 'en',
    title: 'Home gallery',
    status: 'published',
    payload: {
      items: [
        {
          src: '/ink-editor-demo.gif',
          label: 'Editor demo',
          alt: 'Ink editor demo',
        },
        {
          src: '/ink-drag-drop-install.gif',
          label: 'Drag & drop install',
          alt: 'Drag drop plugin install',
        },
      ],
    },
  });

  await upsertContent({
    collection: 'docs',
    slug: 'plugins',
    locale: 'en',
    title: 'Plugins docs',
    status: 'published',
    payload: {
      media: '/ink-drag-drop-install.gif',
      body: 'Install plugins via npm or drag a .ink package onto the editor.',
    },
  });

  await upsertContent({
    collection: 'editors',
    slug: 'variants',
    locale: 'en',
    title: 'Editor variants',
    status: 'published',
    payload: {
      variants: ['classic', 'document', 'simple', 'agent', 'docx', 'notion-like'],
    },
  });

  console.log('cms content + media tables ready');
};

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
