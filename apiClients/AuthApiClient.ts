import { ApiClient } from './ApiClient';
import type { 
  SignInRequest, 
  SignUpRequest, 
  UpdateTokenRequest, 
  ResetPasswordRequest,
  AuthResponse,
  BillingResponse 
} from '../model/AuthRequest';

export class AuthApiClient {
  static async refreshBilling(): Promise<BillingResponse> {
    return ApiClient.get<BillingResponse>('/billing');
  }

  static async refreshToken(userId: string): Promise<AuthResponse> {
    const request: UpdateTokenRequest = { userId };
    return ApiClient.post<AuthResponse>('/auth/updateToken', request);
  }

  static async createUser(email: string, password: string): Promise<AuthResponse> {
    const request: SignUpRequest = { email, password };
    return ApiClient.post<AuthResponse>('/auth/signUp', request);
  }

  static async login(email: string, password: string): Promise<AuthResponse> {
    const request: SignInRequest = { email, password };
    return ApiClient.post<AuthResponse>('/auth/signIn', request);
  }

  static async sendForgotPasswordEmail(email: string): Promise<void> {
    return ApiClient.post<void>(`/auth/forgotPassword/${email}`);
  }

  static async setNewPassword(code: string, email: string, password: string): Promise<void> {
    const request: ResetPasswordRequest = { email, password };
    return ApiClient.post<void>(`/auth/resetPassword/${code}`, request);
  }
}
