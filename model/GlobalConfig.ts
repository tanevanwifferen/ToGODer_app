export interface Prompt {
  id: string;
  content: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface PromptsResponse {
  prompts: Prompt[];
}

export interface Model {
  model: string;
  title: string;
}

export interface GlobalConfig {
  donateOptions: unknown[];
  quote: string;
  models: Model[];
  prompts: Record<string, {
    prompt: string;
    description: string;
    display: boolean;
    aliases?: string[];
  }>;
}