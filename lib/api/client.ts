export interface ApiClient {
  get<T>(path: string, params?: Record<string, string>): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
  upload<T>(path: string, formData: FormData): Promise<T>;
}

export { ApiError } from "@/lib/api/errors";

import { mockClient } from "@/lib/mock/adapter";
export const apiClient: ApiClient = mockClient;
