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
);

CREATE INDEX IF NOT EXISTS cms_pages_status_idx ON cms_pages (status);
CREATE INDEX IF NOT EXISTS cms_pages_updated_at_idx ON cms_pages (updated_at DESC);

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
ON CONFLICT (slug) DO NOTHING;
