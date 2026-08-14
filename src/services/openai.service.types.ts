export type OpenAiCompleteInput = {
  prompt: string;
  capability?: string;
  html?: string;
  selectionHtml?: string;
  modelId?: string;
};

export type OpenAiCompleteResult = {
  text: string;
  html?: string;
  tokens: number;
  model: string;
};

export type OpenAiChatCompletionsResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    total_tokens?: number;
  };
};
