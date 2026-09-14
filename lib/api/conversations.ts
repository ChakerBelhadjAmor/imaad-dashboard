import { apiClient } from "./client";
import type { Conversation, ConversationStatus } from "@/lib/types/models";

export function listConversations(status?: ConversationStatus) {
  return apiClient.get<Conversation[]>("/api/conversations", status ? { status } : undefined);
}
export function getConversation(id: string) {
  return apiClient.get<Conversation>(`/api/conversations/${id}`);
}
export function updateConversationStatus(id: string, status: ConversationStatus) {
  return apiClient.patch<Conversation>(`/api/conversations/${id}/status`, { status });
}
export function assignConversation(id: string) {
  return apiClient.post<Conversation>(`/api/conversations/${id}/assign`);
}
