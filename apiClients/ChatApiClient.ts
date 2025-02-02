import { ApiClient } from './ApiClient';
import { ChatRequestCommunicationStyle, ApiChatMessage } from '../model/ChatRequest';
import { ChatResponse, TitleResponse, ExperienceResponse, UpdateMemoryResponse } from '../model/ChatResponse';

export class ChatApiClient {
  /**
   * Updates memory asynchronously for a given set of messages.
   * This endpoint returns the same updateData object as /chat but processes it asynchronously.
   */
  static async updateMemory(
    model: string,
    messages: ApiChatMessage[],
    configurableData?: string,
    staticData?: Record<string, any> | undefined,
    assistant_name?: string | undefined,
    memoryIndex?: string[] | undefined,
    memories?: Record<string, string> | undefined,
  ): Promise<UpdateMemoryResponse> {
    const response = await ApiClient.post<UpdateMemoryResponse>('/chat/memory-update', {
      model,
      prompts: messages,
      configurableData,
      staticData,
      assistant_name,
      memoryIndex,
      memories,
    });

    return response;
  }

  static async sendMessage(
    model: string,
    humanPrompt: boolean = true,
    keepGoing: boolean = true,
    outsideBox: boolean = true,
    holisticTherapist: boolean = true,
    communicationStyle: ChatRequestCommunicationStyle,
    messages: ApiChatMessage[],
    configurableData?: string,
    staticData?: Record<string, any> | undefined,
    assistant_name?: string | undefined,
    memoryIndex?: string[] | undefined,
    memories?: Record<string, string> | undefined,
  ): Promise<ChatResponse> {
    const response = await ApiClient.post<ChatResponse>('/chat', {
      model,
      humanPrompt,
      keepGoing,
      outsideBox,
      holisticTherapist,
      communicationStyle,
      prompts: messages,
      configurableData,
      staticData,
      assistant_name,
      memoryIndex,
      memories,
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
