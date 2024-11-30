import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

export interface AuthStore {
  token: string | null;
}

export interface RateLimitError {
  type: 'RateLimit';
  waitTime: number;
  minutes: number;
  seconds: number;
}

export class ApiClient {
  private static authStore: AuthStore | null = null;
  private static axiosInstance: AxiosInstance = axios.create({
      baseURL: 'https://dev.togoder.click/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });
;

  static initialize(authStore: AuthStore): void {
    ApiClient.authStore = authStore;
    // Request interceptor for adding auth token
    ApiClient.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.authStore?.token) {
          console.log(this.authStore?.token);
          config.headers.set('Authorization', `Bearer ${this.authStore.token}`);
        }
        return config;
      },
      (error: unknown) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for handling common errors
    ApiClient.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000;
          return Promise.reject({
            type: 'RateLimit',
            waitTime,
            minutes: Math.floor(waitTime / 60000),
            seconds: Math.floor((waitTime % 60000) / 1000),
          } as RateLimitError);
        }
        console.error('API error:', error);
        return Promise.reject((error as any).response?.data);
      }
    );
  }

  static async get<T>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
    if (!ApiClient.axiosInstance) {
      throw new Error('ApiClient not initialized');
    }
    const response = await ApiClient.axiosInstance.get<T>(url, config);
    return response.data;
  }

  static async post<T>(url: string, data: unknown = {}, config: AxiosRequestConfig = {}): Promise<T> {
    if (!ApiClient.axiosInstance) {
      throw new Error('ApiClient not initialized');
    }
    const response = await ApiClient.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  static async put<T>(url: string, data: unknown = {}, config: AxiosRequestConfig = {}): Promise<T> {
    if (!ApiClient.axiosInstance) {
      throw new Error('ApiClient not initialized');
    }
    const response = await ApiClient.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  static async delete<T>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
    if (!ApiClient.axiosInstance) {
      throw new Error('ApiClient not initialized');
    }
    const response = await ApiClient.axiosInstance.delete<T>(url, config);
    return response.data;
  }
}
