import { apiClient } from "./client";
import type { User } from "@/lib/types/models";

export function login(input: { email: string; password: string }) {
  return apiClient.post<{ accessToken: string; user: User }>("/api/auth/login", input);
}
export function register(input: { name: string; email: string; password: string; orgName: string }) {
  return apiClient.post<{ accessToken: string; user: User }>("/api/auth/register", input);
}
