import { PLAN_CAPABILITIES, PLAN_LICENSE_FEATURES, PLAN_MONTHLY_TOKEN_LIMIT } from '../const/plans.const.js';
import { DOCS_SEED_PAGES } from '../data/docsPages.seed.js';
import { upsertContent } from '../repositories/content.repository.js';

const EDITOR_VARIANTS = [
  {
    slug: 'classic',
    title: 'Classic',
    html: '<h2>Classic editor</h2><p>Boxed toolbar chrome — default product surface.</p>',
  },
  {
    slug: 'document',
    title: 'Document',
    html: '<h2>Document</h2><p>Long-form paper with block outlines.</p>',
  },
  {
    slug: 'simple',
    title: 'Simple',
    html: '<p>Minimal toolbar. Fast notes and comments.</p>',
  },
  {
    slug: 'agent',
    title: 'Agent',
    html: '<h2>Agent workspace</h2><p>Floating ask bar above the document.</p>',
  },
  {
    slug: 'docx',
    title: 'Docx',
    html: '<h1>Report title</h1><p>Word-like page canvas for formal docs.</p>',
  },
  {
    slug: 'notion-like',
    title: 'Notion-like',
    html: '<h1>Untitled</h1><p>Wide reading column, quiet chrome.</p>',
  },
] as const;

const run = async () => {
  await upsertContent({
    collection: 'home',
    slug: 'gallery',
    locale: 'en',
    title: 'Home gallery',
    status: 'published',
    payload: {
      items: [
        { src: '/ink-editor-demo.gif', label: 'Editor demo', alt: 'Ink editor demo' },
        { src: '/ink-drag-drop-install.gif', label: 'Drag & drop install', alt: 'Plugin install' },
        { src: '/ink-landing.png', label: 'Landing', alt: 'Ink landing' },
        { src: '/ink-hero.png', label: 'Hero', alt: 'Ink hero' },
      ],
    },
  });

  await upsertContent({
    collection: 'home',
    slug: 'hero',
    locale: 'en',
    title: 'Home hero',
    status: 'published',
    payload: {
      headline: 'A rich text editor that just feels right.',
      support:
        'Lightweight, extensible, and built for developers — with tables, comments, track changes, and pluggable Ink AI.',
    },
  });

  for (const doc of DOCS_SEED_PAGES) {
    await upsertContent({
      collection: 'docs',
      slug: doc.slug,
      locale: 'en',
      title: doc.title,
      status: 'published',
      payload: {
        labelKey: doc.labelKey,
        blocks: doc.blocks,
        sections: doc.sections,
      },
    });
  }

  for (const plan of ['free', 'pro', 'ai'] as const) {
    const capability = PLAN_CAPABILITIES[plan];
    await upsertContent({
      collection: 'plans',
      slug: plan,
      locale: 'en',
      title: plan.toUpperCase(),
      status: 'published',
      payload: {
        plan,
        portalTier: capability.portalTier,
        aiMode: capability.aiMode,
        monthlyTokenLimit: PLAN_MONTHLY_TOKEN_LIMIT[plan],
        licenseFeatures: PLAN_LICENSE_FEATURES[plan],
        price:
          plan === 'free'
            ? { amount: 0, period: 'forever', label: '$0' }
            : plan === 'pro'
              ? { amount: 29, period: 'once', label: '$29' }
              : { amount: 19, period: 'month', label: '$19' },
      },
    });
  }

  for (const variant of EDITOR_VARIANTS) {
    await upsertContent({
      collection: 'editors',
      slug: variant.slug,
      locale: 'en',
      title: variant.title,
      status: 'published',
      payload: {
        variant: variant.slug,
        html: variant.html,
      },
    });
  }

  console.log('seeded home, docs, plans, editors into cms_content');
};

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
