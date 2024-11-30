import { ApiClient } from './ApiClient';

export interface ExperienceRequest {
  language: string;
}

export interface ExperienceResponse {
  content: string;
}

export class ExperienceApiClient {
  static async getExperience(request: ExperienceRequest): Promise<ExperienceResponse> {
    return ApiClient.post<ExperienceResponse>('/experience', request);
  }
}
