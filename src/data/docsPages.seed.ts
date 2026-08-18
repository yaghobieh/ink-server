export type DocsSeedBlock =
  | { type: 'p'; text: string }
  | { type: 'code'; code: string; language?: 'tsx' | 'html' | 'json' | 'bash' }
  | { type: 'html'; html: string }
  | { type: 'image'; src: string; alt?: string }
  | { type: 'steps'; title?: string; items: { title: string; body: string }[] }
  | {
      type: 'demo';
      id: string;
      title?: string;
      description?: string;
      initialHtml: string;
      code: string;
      editor?: Record<string, unknown>;
      payload?: { label: string; data: unknown };
      showLiveHtml?: boolean;
    }
  | { type: 'payload'; label: string; data: unknown };

export type DocsSeedSection =
  | { type: 'header'; text: string }
  | { type: 'paragraph'; text: string }
  | {
      type: 'list';
      title?: string;
      items: string[] | { title: string; body: string }[];
    }
  | { type: 'code'; language?: string; code: string }
  | { type: 'html'; html: string }
  | { type: 'image'; src: string; alt?: string }
  | { type: 'demo'; [key: string]: unknown };

export type DocsSeedPage = {
  slug: string;
  title: string;
  labelKey: string;
  blocks: DocsSeedBlock[];
  sections: DocsSeedSection[];
};

const blocksToSections = (title: string, blocks: DocsSeedBlock[]): DocsSeedSection[] => {
  const sections: DocsSeedSection[] = [{ type: 'header', text: title }];
  for (const block of blocks) {
    if (block.type === 'p') {
      sections.push({ type: 'paragraph', text: block.text });
      continue;
    }
    if (block.type === 'steps') {
      sections.push({
        type: 'list',
        title: block.title,
        items: block.items,
      });
      continue;
    }
    if (block.type === 'code') {
      sections.push({
        type: 'code',
        language: block.language,
        code: block.code,
      });
      continue;
    }
    if (block.type === 'html') {
      sections.push({ type: 'html', html: block.html });
      continue;
    }
    if (block.type === 'image') {
      sections.push({ type: 'image', src: block.src, alt: block.alt });
      continue;
    }
    if (block.type === 'demo') {
      sections.push({
        type: 'demo',
        id: block.id,
        title: block.title,
        description: block.description,
        initialHtml: block.initialHtml,
        code: block.code,
        editor: block.editor,
        payload: block.payload,
        showLiveHtml: block.showLiveHtml,
      });
      continue;
    }
    if (block.type === 'payload') {
      sections.push({
        type: 'code',
        language: 'json',
        code: JSON.stringify({ label: block.label, data: block.data }, null, 2),
      });
    }
  }
  return sections;
};

const page = (
  slug: string,
  title: string,
  labelKey: string,
  blocks: DocsSeedBlock[],
): DocsSeedPage => ({
  slug,
  title,
  labelKey,
  blocks,
  sections: blocksToSections(title, blocks),
});

const placeholder = (
  slug: string,
  title: string,
  labelKey: string,
  summary: string,
  topics: { title: string; body: string }[],
): DocsSeedPage =>
  page(slug, title, labelKey, [
    { type: 'p', text: summary },
    { type: 'steps', title: 'Topics', items: topics },
  ]);

const DEMO_QUICKSTART: DocsSeedBlock = {
  type: 'demo',
  id: 'quickstart-live',
  title: 'Hello Ink',
  description: 'Type here, then open HTML and Payload tabs.',
  initialHtml: '<p>Hello Ink</p>',
  code: `import { useState } from 'react';
import { InkEditor } from '@forgedevstack/ink';
import '@forgedevstack/ink/styles.css';

export function App() {
  const [value, setValue] = useState('<p>Hello Ink</p>');
  return (
    <InkEditor
      value={value}
      onChange={setValue}
      variant="classic"
      typoAutoFix
    />
  );
}`,
  editor: {
    variant: 'classic',
    typoAutoFix: true,
    toolbar: ['bold', 'italic', 'undo', 'redo'],
  },
  payload: {
    label: 'Initial state payload',
    data: {
      value: '<p>Hello Ink</p>',
      variant: 'classic',
      typoAutoFix: true,
    },
  },
};

const DEMO_CONFIGURATION: DocsSeedBlock = {
  type: 'demo',
  id: 'config-core',
  title: 'What changes when you set props',
  description:
    'Toggle modules via features, persist with keepInMemory, and watch the live HTML + payload tabs as you type.',
  initialHtml: '<p>Edit props and watch the editor respond.</p>',
  code: `const [html, setHtml] = useState('<p>Edit props and watch the editor respond.</p>');

<InkEditor
  value={html}
  onChange={setHtml}
  variant="classic"
  keepInMemory
  memoryKey="docs-config"
  showCharCount
  features={{
    table: true,
    signature: true,
    findReplace: true,
    horizontalRule: true,
    blocks: true,
    slash: true,
  }}
  toolbar={[
    'headingDropdown',
    'bold',
    'italic',
    'divider',
    'table',
    'signature',
    'findReplace',
    'horizontalRule',
    'undo',
    'redo',
  ]}
/>`,
  editor: {
    variant: 'classic',
    keepInMemory: true,
    memoryKey: 'docs-config',
    showCharCount: true,
    features: {
      table: true,
      signature: true,
      findReplace: true,
      horizontalRule: true,
      blocks: true,
      slash: true,
    },
    toolbar: [
      'headingDropdown',
      'bold',
      'italic',
      'divider',
      'table',
      'signature',
      'findReplace',
      'horizontalRule',
      'undo',
      'redo',
    ],
  },
  payload: {
    label: 'Controlled state shape',
    data: {
      props: {
        variant: 'classic',
        keepInMemory: true,
        memoryKey: 'docs-config',
        features: {
          table: true,
          signature: true,
          findReplace: true,
          horizontalRule: true,
          blocks: true,
          slash: true,
        },
      },
    },
  },
};

const DEMO_TABLES: DocsSeedBlock = {
  type: 'demo',
  id: 'tables-live',
  title: 'Tables',
  description: 'Click the table toolbar button to insert N×M. Edit cells inline. HTML uses .Ink-table.',
  initialHtml:
    '<table class="Ink-table"><tbody><tr><td>A1</td><td>B1</td><td>C1</td></tr><tr><td>A2</td><td>B2</td><td>C2</td></tr></tbody></table>',
  code: `<InkEditor
  value={html}
  onChange={setHtml}
  tableRows={3}
  tableCols={3}
  features={{ table: true }}
  toolbar={['bold', 'italic', 'table', 'undo', 'redo']}
/>`,
  editor: {
    tableRows: 3,
    tableCols: 3,
    features: { table: true },
    toolbar: ['bold', 'italic', 'table', 'undo', 'redo'],
  },
};

export const DOCS_SEED_PAGES: DocsSeedPage[] = [
  page('installation', 'Installation', 'tocInstallation', [
    {
      type: 'p',
      text: 'Ink is a React rich-text editor that stores content as HTML and exposes structured side-channel state (comments, track changes) as JSON-friendly payloads. Install the package once, import styles once, then mount InkEditor in any form or document surface.',
    },
    {
      type: 'steps',
      title: 'What you get',
      items: [
        {
          title: 'npm package',
          body: 'Adds the editor runtime, toolbar presets, and CSS entry under @forgedevstack/ink.',
        },
        {
          title: 'Styles entry',
          body: 'One import of @forgedevstack/ink/styles.css at the app root styles the chrome and content.',
        },
        {
          title: 'Controlled mount',
          body: 'value / onChange keeps the parent as source of truth — ideal for forms and save APIs.',
        },
      ],
    },
    { type: 'code', language: 'bash', code: 'npm install @forgedevstack/ink' },
    {
      type: 'code',
      language: 'tsx',
      code: `import { InkEditor } from '@forgedevstack/ink';
import '@forgedevstack/ink/styles.css';`,
    },
    {
      type: 'html',
      html: 'Package: <a class="ink-doc-link" href="https://www.npmjs.com/package/@forgedevstack/ink" target="_blank" rel="noreferrer">@forgedevstack/ink</a>',
    },
  ]),

  page('quickstart', 'Quickstart', 'tocQuickstart', [
    {
      type: 'p',
      text: 'The quickest path to a working editor: one controlled HTML string, a classic chrome variant, and optional typo auto-fix on blur. Use this when you want to see HTML and payload tabs update as you type.',
    },
    {
      type: 'steps',
      title: 'What we change',
      items: [
        {
          title: 'value / onChange',
          body: 'Parent owns HTML. Every keystroke updates React state — open the HTML / Payload tabs to see it.',
        },
        {
          title: 'variant="classic"',
          body: 'Soft card chrome for marketing and forms. Switch to document later for long-form.',
        },
        {
          title: 'typoAutoFix',
          body: 'On blur, common typos are rewritten in the HTML string.',
        },
      ],
    },
    DEMO_QUICKSTART,
  ]),

  page('configuration', 'Configuration', 'tocConfiguration', [
    {
      type: 'p',
      text: 'Configuration is prop-driven and block-friendly: HTML lives in value, modules gate via features, and chrome is ordered through toolbar[]. Each prop below changes editor behaviour — try the live demo, then inspect Code / HTML / Payload tabs.',
    },
    {
      type: 'steps',
      title: 'What each group changes',
      items: [
        {
          title: 'value / onChange',
          body: 'Controlled HTML string. Parent owns the document; every keystroke emits HTML.',
        },
        {
          title: 'features',
          body: 'Module switches: table, trackChanges, comments, ai, blocks, slash, signature, findReplace, horizontalRule.',
        },
        {
          title: 'toolbar',
          body: 'Ordered list of ToolbarOption strings. Missing items never render — even if the feature flag is on.',
        },
        {
          title: 'keepInMemory + memoryKey',
          body: 'Writes drafts to localStorage under ink-memory:{key}. On mount restores and calls onChange so controlled apps refresh correctly.',
        },
        {
          title: 'variant',
          body: 'classic = soft card shell. document = page-like with stronger block outlines.',
        },
      ],
    },
    DEMO_CONFIGURATION,
    {
      type: 'payload',
      label: 'Full props cheat-sheet (subset)',
      data: {
        value: 'string HTML',
        onChange: '(html: string) => void',
        defaultValue: 'string HTML (uncontrolled)',
        variant: 'classic | document',
        features: {
          table: true,
          trackChanges: true,
          comments: true,
          ai: true,
          blocks: true,
          slash: true,
          signature: true,
          findReplace: true,
          horizontalRule: true,
        },
        keepInMemory: true,
        memoryKey: 'unique-per-editor',
        toolbar: ['bold', 'italic', 'signature'],
        author: 'You',
        tableRows: 3,
        tableCols: 3,
        showCommentsPanel: true,
        ai: { enabled: true, placement: 'sidebar' },
      },
    },
  ]),

  page('toolbar', 'Toolbar', 'tocToolbar', [
    {
      type: 'image',
      src: '/docs/toolbar.svg',
      alt: 'Toolbar presets and format controls',
    },
    {
      type: 'p',
      text: 'The toolbar is an ordered array of ToolbarOption strings. Order is layout; omitting an option hides it even when the matching feature flag is on. Presets (INK_DEFAULT_TOOLBAR, INK_SIMPLE_TOOLBAR, INK_COLLAB_TOOLBAR) cover common product shapes.',
    },
    {
      type: 'steps',
      title: 'What you get',
      items: [
        {
          title: 'Add an option',
          body: 'Push a ToolbarOption into toolbar[] and enable the matching features flag when required.',
        },
        {
          title: 'divider',
          body: 'Visual separator only — no command.',
        },
        {
          title: 'headingDropdown',
          body: 'Maps to block formats h1–h6 / paragraph.',
        },
        {
          title: 'Dropdowns',
          body: 'fontDropdown, listDropdown, findReplaceDropdown, and directionLtr / directionRtl for denser chrome.',
        },
      ],
    },
    {
      type: 'code',
      language: 'tsx',
      code: `import { INK_DEFAULT_TOOLBAR, INK_COLLAB_TOOLBAR } from '@forgedevstack/ink';

toolbar={[
  'headingDropdown',
  'fontDropdown',
  'listDropdown',
  'divider',
  'bold',
  'italic',
  'signature',
  'findReplaceDropdown',
  'directionLtr',
  'directionRtl',
  'horizontalRule',
  'divider',
  'undo',
  'redo',
]}

toolbar={INK_DEFAULT_TOOLBAR}
toolbar={INK_COLLAB_TOOLBAR}`,
    },
    {
      type: 'p',
      text: 'Tip: use a short toolbar for marketing forms and expand to collab presets when you need comments, track changes, and find/replace.',
    },
  ]),

  page('modules', 'Modules', 'tocModules', [
    {
      type: 'p',
      text: 'features={{ … }} is the module gate. Think of each flag as unlocking a capability; toolbar[] still decides which controls appear. A feature flag alone never renders a button.',
    },
    {
      type: 'steps',
      title: 'What each flag changes',
      items: [
        {
          title: 'table',
          body: 'Enables table insert + cell editing. Pair with toolbar "table" and optional tableRows/tableCols.',
        },
        {
          title: 'trackChanges',
          body: 'Insert/delete marks + trackChanges[] payload. Pair with toolbar trackChanges + trackChangesEnabled.',
        },
        {
          title: 'comments',
          body: 'Selection threads + comments/onCommentsChange. Pair with toolbar comments + showCommentsPanel.',
        },
        {
          title: 'blocks + slash',
          body: 'Block handles (↑↓) and / menu. Best with variant="document".',
        },
        {
          title: 'signature / findReplace / horizontalRule',
          body: 'Sign pad canvas, find panel, and HR insert — each needs its toolbar option.',
        },
        {
          title: 'ai',
          body: 'Side panel. Pair with toolbar ai + ai={{ enabled: true }}.',
        },
      ],
    },
    DEMO_CONFIGURATION,
    {
      type: 'code',
      language: 'tsx',
      code: `features={{
  table: true,
  trackChanges: true,
  comments: true,
  ai: true,
  blocks: true,
  slash: true,
  signature: true,
  findReplace: true,
  horizontalRule: true,
}}`,
    },
  ]),

  page('tables', 'Tables', 'tocTables', [
    {
      type: 'p',
      text: 'Tables are HTML-first: insert injects a <table class="Ink-table"> into the document string. tableRows / tableCols control the insert size; cells stay contenteditable so the parent always receives real markup.',
    },
    {
      type: 'steps',
      title: 'What you get',
      items: [
        { title: 'Enable', body: 'features.table + toolbar includes "table".' },
        { title: 'Insert', body: 'Toolbar table button injects HTML table markup.' },
        { title: 'Edit', body: 'Click cells and type. HTML payload shows <table class="Ink-table">.' },
        {
          title: 'Helper',
          body: 'buildTableHtml(rows, cols) builds the same markup for server-side or tests.',
        },
      ],
    },
    DEMO_TABLES,
  ]),

  placeholder('track-changes', 'Track changes', 'tocTrackChanges', 'Track changes uses HTML marks plus a parallel trackChanges[] JSON payload for Accept/Reject review UIs.', [
    { title: 'Enable', body: 'features.trackChanges + toolbar trackChanges + trackChangesEnabled.' },
    { title: 'Edit with TC on', body: 'Inserts wrap Ink-tc-insert; deletes wrap Ink-tc-delete.' },
    { title: 'Review', body: 'Accept/Reject strip updates trackChanges payload.' },
  ]),

  placeholder('comments', 'Comments', 'tocComments', 'Comments attach to a selection and sync through comments / onCommentsChange as structured threads.', [
    { title: 'Enable', body: 'features.comments + toolbar comments.' },
    { title: 'Annotate', body: 'Select text, click Comments, enter body.' },
    { title: 'Sync', body: 'comments / onCommentsChange keep the thread payload in React state.' },
  ]),

  placeholder('blocks', 'Blocks', 'tocBlocks', 'Block mode treats the document as stacked sections with ↑↓ handles and slash insert. Prefer variant="document" for long-form.', [
    { title: 'variant="document"', body: 'Stronger block chrome — best for long-form docs.' },
    { title: 'features.blocks', body: 'Shows ↑↓ handles on the active block.' },
    { title: 'features.slash', body: 'Type / then choose heading, list, table, AI.' },
  ]),

  placeholder('sign-pad', 'Sign pad', 'tocSignPad', 'Sign pad opens a canvas for pointer or touch strokes and inserts a PNG data URL into the HTML payload.', [
    { title: 'Enable', body: 'features.signature + toolbar "signature".' },
    { title: 'Draw', body: 'Pointer/touch strokes on the white pad.' },
    { title: 'Insert', body: 'Confirm inserts data:image/png;base64,… into the document.' },
  ]),

  placeholder('keep-in-memory', 'Keep in memory', 'tocMemory', 'keepInMemory persists the HTML draft under ink-memory:{memoryKey} in localStorage and restores on mount.', [
    { title: 'Write', body: 'Every emitChange writes localStorage.' },
    { title: 'Restore', body: 'On mount, remembered HTML is applied and onChange fires.' },
    { title: 'Clear', body: 'clearInkMemory(memoryKey) from @forgedevstack/ink utils.' },
  ]),

  page('find-replace', 'Find & replace', 'tocFindReplace', [
    {
      type: 'image',
      src: '/docs/find-replace.svg',
      alt: 'Find and replace across the document',
    },
    {
      type: 'p',
      text: 'Find and replace walks text nodes only — attribute values and class names stay untouched. Use the toolbar findReplace control (or findReplaceDropdown in 1.1.4+) to open the panel, then replace one match or all.',
    },
    {
      type: 'steps',
      title: 'What you get',
      items: [
        {
          title: 'Open panel',
          body: 'Toolbar findReplace or findReplaceDropdown.',
        },
        {
          title: 'Replace one / all',
          body: 'Runs replaceInHtml under the hood.',
        },
        {
          title: 'Verify',
          body: 'Markup attributes remain while text updates.',
        },
      ],
    },
    {
      type: 'demo',
      id: 'find-replace-live',
      title: 'Find & replace',
      description:
        'Open find/replace from the toolbar. Only text nodes change — class="find-me" stays intact.',
      initialHtml: '<p class="find-me">find me once, find me twice</p>',
      code: `<InkEditor
  value={html}
  onChange={setHtml}
  features={{ findReplace: true }}
  toolbar={['findReplace', 'bold', 'italic']}
/>`,
      editor: {
        features: { findReplace: true },
        toolbar: ['findReplace', 'bold', 'italic'],
      },
      payload: {
        label: 'replaceInHtml(html, find, replace, replaceAll)',
        data: {
          find: 'find',
          replace: 'seek',
          replaceAll: true,
          preservesAttributes: true,
        },
      },
      showLiveHtml: true,
    },
    {
      type: 'code',
      language: 'tsx',
      code: `features={{ findReplace: true }}
toolbar={['findReplace', 'bold', 'italic']}

// Helper (same pipeline as the panel)
import { replaceInHtml } from '@forgedevstack/ink';
const next = replaceInHtml(html, 'find', 'seek', true);`,
    },
  ]),

  placeholder('themes', 'Themes', 'tocThemes', 'Theming is CSS-variable driven on .Ink-Editor. Helper classes swap presets; Premium unlocks theme={{ … }} token overrides.', [
    { title: 'CSS variables', body: 'Override --ink-bg, --ink-text, --ink-border, --ink-toolbar, --ink-accent, --ink-shadow, --ink-radius.' },
    { title: 'Helper classes', body: 'ink-theme-snow, ink-theme-bubble, ink-theme-dark, or ink-theme-minimal.' },
    { title: 'Premium tokens', body: 'theme={{ accent, background, radius, … }} when premium is enabled.' },
  ]),

  placeholder('typo', 'Typo auto-fix', 'tocTypo', 'typoAutoFix rewrites common typos in the HTML string on blur. Export applyTypoAutoFix for the same pipeline outside the editor.', [
    { title: 'On blur', body: 'Pass typoAutoFix on InkEditor to fix as the user leaves the field.' },
    { title: 'Standalone helper', body: 'applyTypoAutoFix(html) returns { html, fixedCount }.' },
    { title: 'Safe on markup', body: 'Only text content is rewritten; tags and attributes stay intact.' },
  ]),

  placeholder('plugins', 'Plugins', 'tocPlugins', 'Ink plugins mirror the AI provider pattern: register in JS, optional host config. npm remains supported for apps and CI; .ink packages enable drag-and-drop install.', [
    { title: 'Install packages', body: 'npm install @forgedevstack/ink @forgedevstack/ink-excel' },
    { title: 'Register handler', body: 'inkExcel.register(createCsvExcelHandler()) — same idea as inkAi.registerProvider.' },
    { title: 'Import / export', body: 'inkExcel.import(file) → Ink-table HTML; inkExcel.export(html) → CSV blob.' },
  ]),

  placeholder('ai', 'AI', 'tocAi', 'AI opens as a side panel via ai={{ enabled: true }}. Register your own LLM with inkAi.registerProvider for production.', [
    { title: 'Enable UI', body: 'features.ai + toolbar ai + ai.enabled.' },
    { title: 'Demo provider', body: 'Works offline for marketing demos.' },
    { title: 'BYO LLM', body: 'Register a provider; models come from INK_AI_MODEL_CATALOG.' },
  ]),

  placeholder('angular', 'Angular', 'tocAngular', 'Angular apps can host Ink through helpers at @forgedevstack/ink/angular. Props and HTML payloads stay the same as in React.', [
    { title: 'Angular entry', body: 'Import helpers from @forgedevstack/ink/angular.' },
    { title: 'Same props model', body: 'value / onChange, features, and toolbar behave like the React API.' },
    { title: 'Bridge-friendly', body: 'Use your preferred React-in-Angular bridge; Ink stays a controlled HTML surface.' },
  ]),

  placeholder('wordpress', 'WordPress', 'tocWordpress', 'WordPress integration ships as a classic meta box stub inside the npm package (wordpress/ink-editor).', [
    { title: 'Package stub', body: 'Find wordpress/ink-editor in the published @forgedevstack/ink package.' },
    { title: 'Meta box mount', body: 'Classic admin box hosts the React editor for HTML content fields.' },
    { title: 'Same HTML model', body: 'Saved content remains an HTML string compatible with WP post content or custom meta.' },
  ]),

  placeholder('accessibility', 'Accessibility', 'tocA11y', 'Ink toolbar controls expose titles and the contenteditable surface supports keyboard formatting. Accessibility is a product concern when theming.', [
    { title: 'Control titles', body: 'Toolbar buttons expose accessible titles for screen readers.' },
    { title: 'Keyboard formatting', body: 'contenteditable supports common keyboard formatting shortcuts.' },
    { title: 'Theme contrast', body: 'Prefer labelled wrappers and sufficient contrast when overriding CSS variables.' },
  ]),

  placeholder('premium', 'Premium', 'tocPremium', 'Premium unlocks theme tokens, custom icons, rich paste, onImageUpload, and wysiwyg behaviour. Same package — gate with the premium prop.', [
    { title: 'Ink (free)', body: 'MIT core — no premium tokens, no hosted AI.' },
    { title: 'Ink Pro', body: 'Theme / icons / rich paste / BYO AI key via premium + provider register.' },
    { title: 'Ink AI', body: 'Hosted OpenAI — entitlements + token usage from ink-server (Neon).' },
  ]),
];
