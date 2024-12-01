import { store } from '@/redux';
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

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
  private static axiosInstance: AxiosInstance = axios.create({
      baseURL: 'https://chat.togoder.click/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });
;

  static initialize(): void {
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

  static extendConfig(config: AxiosRequestConfig): AxiosRequestConfig {
    const token = store.getState().auth.token;
    const headers : any = {
      ...config.headers,
      'Content-Type': 'application/json',
    };
    if (!!token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    var toreturn = {
      ...config,
      headers
    };
    return toreturn;
  }

  static async get<T>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
    if (!ApiClient.axiosInstance) {
      throw new Error('ApiClient not initialized');
    }
    const response = await ApiClient.axiosInstance.get<T>(url, ApiClient.extendConfig(config));
    return response.data;
  }

  static async post<T>(url: string, data: unknown = {}, config: AxiosRequestConfig = {}): Promise<T> {
    if (!ApiClient.axiosInstance) {
      throw new Error('ApiClient not initialized');
    }
    const response = await ApiClient.axiosInstance.post<T>(url, data, ApiClient.extendConfig(config));
    return response.data;
  }

  static async put<T>(url: string, data: unknown = {}, config: AxiosRequestConfig = {}): Promise<T> {
    if (!ApiClient.axiosInstance) {
      throw new Error('ApiClient not initialized');
    }
    const response = await ApiClient.axiosInstance.put<T>(url, data, ApiClient.extendConfig(config));
    return response.data;
  }

  static async delete<T>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
    if (!ApiClient.axiosInstance) {
      throw new Error('ApiClient not initialized');
    }
    const response = await ApiClient.axiosInstance.delete<T>(url, ApiClient.extendConfig(config));
    return response.data;
  }
}
