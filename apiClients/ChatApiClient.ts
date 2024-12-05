import { ApiClient } from './ApiClient';
import { ChatRequestCommunicationStyle, ApiChatMessage } from '../model/ChatRequest';
import { ChatResponse, TitleResponse, ExperienceResponse } from '../model/ChatResponse';

export class ChatApiClient {
  static async sendMessage(
    model: string,
    humanPrompt: boolean = true,
    keepGoing: boolean = true,
    outsideBox: boolean = true,
    communicationStyle: ChatRequestCommunicationStyle,
    messages: ApiChatMessage[],
    configurableData?: string,
    staticData?: Record<string, any> | undefined,
    assistant_name?: string | undefined
  ): Promise<ChatResponse> {
    const response = await ApiClient.post<ChatResponse>('/chat', {
      model,
      humanPrompt,
      keepGoing,
      outsideBox,
      communicationStyle,
      prompts: messages,
      configurableData,
      staticData,
      assistant_name
    });

    return response;
  }

  static async getTitle(messages: ApiChatMessage[]): Promise<string> {
    const response = await ApiClient.post<TitleResponse>('/title', {
      content: messages
    });

    return response.content;
  }

  static async startExperience(
    model: string, 
    language: string,
    data?: Record<string, any>
  ): Promise<string> {
    const response = await ApiClient.post<ExperienceResponse>('/experience', {
      model,
      language,
      data
    });

    return response.content;
  }
}
