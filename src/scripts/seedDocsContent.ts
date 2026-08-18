import {
  DEFAULT_CONTENT_LOCALE,
  DOCUMENT_TEMPLATE_ID,
  DOCS_COLLECTION,
} from '../const/cms.const.js';
import { SYSTEM_404_SLUG } from '../const/pages.const.js';
import { CONFIG } from '../const/index.js';
import { upsertContent } from '../repositories/content.repository.js';
import { seedDocumentPages } from '../services/docsSeed.service.js';

const SYSTEM_COLLECTION = 'system';

const run = async () => {
  if (!CONFIG.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }
  const seeded = await seedDocumentPages(CONFIG.DATABASE_URL);

  await upsertContent({
    collection: SYSTEM_COLLECTION,
    slug: SYSTEM_404_SLUG,
    locale: DEFAULT_CONTENT_LOCALE,
    title: 'Page not found',
    status: 'published',
    payload: {
      html: '<h1>404</h1><p>This page is missing. Edit this copy in CMS → Content → system / 404.</p>',
      blocks: [
        { type: 'header', text: '404', level: 1 },
        {
          type: 'paragraph',
          text: 'This page is missing. Edit this copy in CMS → Content → system / 404.',
        },
      ],
      editable: true,
      template: DOCUMENT_TEMPLATE_ID,
    },
  });

  console.log(`seeded ${seeded} cms rows + system/404 into cms_content`);
};

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
