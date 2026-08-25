import { neon } from '@neondatabase/serverless';
import {
  DEFAULT_CONTENT_LOCALE,
  DOCUMENT_IMAGE_ALT,
  DOCUMENT_IMAGE_SRC,
  DOCUMENT_STARTER_SLUG,
  DOCUMENT_TEMPLATE_ID,
  DOCUMENT_TEMPLATE_TITLE,
  DOCS_COLLECTION,
  TEMPLATES_COLLECTION,
} from '../const/cms.const.js';
import { DOCS_SEED_PAGES } from '../data/docsPages.seed.js';

const DOCUMENT_TEMPLATE_PAYLOAD = {
  template: DOCUMENT_TEMPLATE_ID,
  kind: TEMPLATES_COLLECTION,
  blocks: [
    {
      type: 'image',
      src: DOCUMENT_IMAGE_SRC,
      alt: DOCUMENT_IMAGE_ALT,
    },
    {
      type: 'p',
      text: 'Document is the default Ink CMS template. Replace this copy, keep the gif, and add code when the page needs a snippet.',
    },
    {
      type: 'code',
      language: 'tsx',
      code: `import { InkEditor } from '@forgedevstack/ink';

<InkEditor
  value={html}
  onChange={setHtml}
  toolbar={['headingDropdown', 'bold', 'italic', 'undo', 'redo']}
/>`,
    },
  ],
};

const upsertCmsRow = async (
  databaseUrl: string,
  collection: string,
  slug: string,
  title: string,
  payload: unknown,
): Promise<void> => {
  const sql = neon(databaseUrl);
  const payloadJson = JSON.stringify(payload);
  await sql`
    INSERT INTO cms_content (collection, slug, locale, title, payload, status)
    VALUES (
      ${collection},
      ${slug},
      ${DEFAULT_CONTENT_LOCALE},
      ${title},
      ${payloadJson}::jsonb,
      'published'
    )
    ON CONFLICT (collection, slug, locale) DO UPDATE
    SET
      title = EXCLUDED.title,
      payload = EXCLUDED.payload,
      status = EXCLUDED.status,
      updated_at = NOW()
  `;
};

export const seedDocumentPages = async (databaseUrl: string): Promise<number> => {
  let count = 0;
  await upsertCmsRow(
    databaseUrl,
    TEMPLATES_COLLECTION,
    DOCUMENT_STARTER_SLUG,
    DOCUMENT_TEMPLATE_TITLE,
    DOCUMENT_TEMPLATE_PAYLOAD,
  );
  count += 1;
  for (const doc of DOCS_SEED_PAGES) {
    await upsertCmsRow(databaseUrl, DOCS_COLLECTION, doc.slug, doc.title, {
      labelKey: doc.labelKey,
      blocks: doc.blocks,
      sections: doc.sections,
      template: DOCUMENT_TEMPLATE_ID,
    });
    count += 1;
  }
  return count;
};
