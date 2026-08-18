import {
  AI_BLOG_NEEDLES,
  AI_DOCS_NEEDLES,
  TEMPLATE_BLOG,
  TEMPLATE_DOCS,
} from '../const/install.const.js';

export const resolveTemplateFromAiPrompt = (
  prompt: string,
  fallback: string,
): string => {
  const lowered = prompt.toLowerCase();
  if (AI_DOCS_NEEDLES.some((needle) => lowered.includes(needle))) {
    return TEMPLATE_DOCS;
  }
  if (AI_BLOG_NEEDLES.some((needle) => lowered.includes(needle))) {
    return TEMPLATE_BLOG;
  }
  return fallback;
};
