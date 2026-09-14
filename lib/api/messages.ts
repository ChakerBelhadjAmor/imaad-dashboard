import { apiClient } from "./client";
import type { Message } from "@/lib/types/models";

export function listMessages(conversationId: string) {
  return apiClient.get<Message[]>(`/api/messages/${conversationId}`);
}
export function sendMessage(conversationId: string, content: string) {
  return apiClient.post<Message>(`/api/messages/${conversationId}`, { content });
}
