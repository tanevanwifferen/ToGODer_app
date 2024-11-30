import { AIProvider } from './AIProvider';

export enum ChatRequestCommunicationStyle {
  Default = 0,
  LessBloat = 1,
  AdaptToConversant = 2,
  Informal = 3,
}

export interface ApiChatMessage {
  content: string;
  role: 'user' | 'assistant';
}

export interface ChatSettings {
  model: AIProvider;
  humanPrompt: boolean | undefined;
  keepGoing: boolean | undefined;
  outsideBox: boolean | undefined;
  communicationStyle: ChatRequestCommunicationStyle | undefined;
  assistant_name: string | undefined;
}

export interface ChatRequest extends ChatSettings {
  prompts: ApiChatMessage[];
}

export interface ExperienceRequest {
  model: AIProvider;
  language: string;
  assistant_name: string | undefined;
}
