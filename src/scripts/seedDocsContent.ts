import { DOCS_SEED_PAGES } from '../data/docsPages.seed.js';
import { upsertContent } from '../repositories/content.repository.js';

const DOCS_COLLECTION = 'docs';
const DEFAULT_LOCALE = 'en';

const run = async () => {
  for (const doc of DOCS_SEED_PAGES) {
    await upsertContent({
      collection: DOCS_COLLECTION,
      slug: doc.slug,
      locale: DEFAULT_LOCALE,
      title: doc.title,
      status: 'published',
      payload: {
        labelKey: doc.labelKey,
        blocks: doc.blocks,
        sections: doc.sections,
      },
    });
  }

  console.log(`seeded ${DOCS_SEED_PAGES.length} docs pages into cms_content`);
};

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
