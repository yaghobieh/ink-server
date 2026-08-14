import { CONFIG } from '../const/config.const.js';
import {
  OPENAI_AUTH_BEARER_PREFIX,
  OPENAI_AUTOCOMPLETE_MAX_TOKENS,
  OPENAI_CAPABILITY_AUTOCOMPLETE,
  OPENAI_CHAT_COMPLETIONS_URL,
  OPENAI_CONTENT_TYPE_JSON,
  OPENAI_DEFAULT_MAX_TOKENS,
  OPENAI_DEFAULT_MODEL,
  OPENAI_DEFAULT_SYSTEM_PROMPT,
  OPENAI_ROLE_SYSTEM,
  OPENAI_ROLE_USER,
  OPENAI_SYSTEM_PROMPTS,
  OPENAI_TEMPERATURE_AUTOCOMPLETE,
  OPENAI_TEMPERATURE_DEFAULT,
} from '../const/openai.const.js';
import type { OpenAiChatCompletionsResponse, OpenAiCompleteInput, OpenAiCompleteResult } from './openai.service.types.js';

const stripTags = (value: string): string => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const cleanAutocompleteText = (value: string): string =>
  value.replace(/^["'`\s]+|["'`\s]+$/g, '').replace(/\n+/g, ' ').trim();

export const completeWithOpenAi = async (
  input: OpenAiCompleteInput,
): Promise<OpenAiCompleteResult> => {
  if (!CONFIG.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const capability = input.capability || 'chat';
  const isAutocomplete = capability === OPENAI_CAPABILITY_AUTOCOMPLETE;
  const model = input.modelId || OPENAI_DEFAULT_MODEL;
  const source = input.selectionHtml || input.html || '';
  const plain = stripTags(source);
  const userContent = isAutocomplete
    ? input.prompt || plain
    : [input.prompt, plain].filter(Boolean).join('\n\n');

  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      Authorization: `${OPENAI_AUTH_BEARER_PREFIX}${CONFIG.OPENAI_API_KEY}`,
      'Content-Type': OPENAI_CONTENT_TYPE_JSON,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: OPENAI_ROLE_SYSTEM,
          content: OPENAI_SYSTEM_PROMPTS[capability] || OPENAI_DEFAULT_SYSTEM_PROMPT,
        },
        {
          role: OPENAI_ROLE_USER,
          content: userContent,
        },
      ],
      max_tokens: isAutocomplete ? OPENAI_AUTOCOMPLETE_MAX_TOKENS : OPENAI_DEFAULT_MAX_TOKENS,
      temperature: isAutocomplete ? OPENAI_TEMPERATURE_AUTOCOMPLETE : OPENAI_TEMPERATURE_DEFAULT,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${detail || response.statusText}`);
  }

  const payload = (await response.json()) as OpenAiChatCompletionsResponse;
  const raw = payload.choices?.[0]?.message?.content ?? '';
  const text = isAutocomplete ? cleanAutocompleteText(raw) : raw.trim();

  return {
    text,
    html: isAutocomplete ? undefined : text,
    tokens: payload.usage?.total_tokens ?? 0,
    model,
  };
};
