export enum ChatRequestCommunicationStyle {
  Default = 0,
  LessBloat = 1,
  AdaptToConversant = 2,
  Informal = 3,
}

export interface ApiChatMessage {
  content: string;
  role: 'user' | 'assistant';
  signature?: string;
  timestamp?: Date | number;
  updateData?: string;
}

export interface ChatSettings {
  model: string;
  humanPrompt: boolean | undefined;
  keepGoing: boolean | undefined;
  outsideBox: boolean | undefined;
  holisticTherapist: boolean | undefined;
  communicationStyle: ChatRequestCommunicationStyle | undefined;
  assistant_name: string | undefined;
  language: string | undefined;
}

export interface ChatRequest extends ChatSettings {
  prompts: ApiChatMessage[];
}

export interface ExperienceRequest {
  model: string;
  language: string;
  assistant_name: string | undefined;
}
