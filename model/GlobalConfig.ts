export interface Prompt {
  prompt: string;
  description: string;
}

export interface PromptsResponse {
  [promptId: string]: Prompt;
}

export interface Model {
  model: string;
  title: string;
}

export interface GlobalConfig {
  donateOptions: unknown[];
  quote: string;
  models: Model[];
  prompts: {
  [promptId: string]: Prompt;
  }
}