export type ChatResponse = MemoryRequestResponse | MessageResponse;

export interface UpdateMemoryResponse {
  updateData: string;
}

export interface MemoryRequestResponse {
  requestForMemory: string[];
}

export interface MessageResponse{
  content: string;
  signature?: string;
  updateData?: string;
}

export interface TitleResponse {
  content: string;
}

export interface ExperienceResponse {
  content: string;
}