import { ApiClient } from './ApiClient';
import { ChatRequestCommunicationStyle, ApiChatMessage } from '../model/ChatRequest';
import { ChatResponse, TitleResponse, ExperienceResponse } from '../model/ChatResponse';

export class ChatApiClient {
  static async sendMessage(
    model: string,
    humanPrompt: boolean,
    keepGoing: boolean,
    outsideBox: boolean,
    communicationStyle: ChatRequestCommunicationStyle,
    messages: ApiChatMessage[]
  ): Promise<ChatResponse> {
    const response = await ApiClient.post<ChatResponse>('/chat', {
      model,
      humanPrompt,
      keepGoing,
      outsideBox,
      communicationStyle,
      prompts: messages
    });

    return {
      content: response.content,
      signature: response.signature,
    };
  }

  static async getTitle(model: string , messages: ApiChatMessage[]): Promise<string> {
    const response = await ApiClient.post<TitleResponse>('/title', {
      model,
      content: messages
    });

    return response.content;
  }

  static async startExperience(model: string, language: string): Promise<string> {
    const response = await ApiClient.post<ExperienceResponse>('/experience', {
      model,
      language,
    });

    return response.content;
  }
}
