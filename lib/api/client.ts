import type { ApiErrorBody } from "@/lib/types/models";

export interface ApiClient {
  get<T>(path: string, params?: Record<string, string>): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
  upload<T>(path: string, formData: FormData): Promise<T>;
}

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

import { mockClient } from "@/lib/mock/adapter";
export const apiClient: ApiClient = mockClient;
