import { apiClient } from "./client";
import type { KBDocument } from "@/lib/types/models";

export function listKbDocuments() {
  return apiClient.get<KBDocument[]>("/api/kb");
}
export function createKbDocument(input: { title: string; content: string }) {
  return apiClient.post<KBDocument>("/api/kb", input);
}
export function uploadKbDocument(formData: FormData) {
  return apiClient.upload<KBDocument>("/api/kb/upload", formData);
}
export function getKbDocument(id: string) {
  return apiClient.get<KBDocument>(`/api/kb/${id}`);
}
export function reprocessKbDocument(id: string) {
  return apiClient.post<KBDocument>(`/api/kb/${id}/reprocess`);
}
export function deleteKbDocument(id: string) {
  return apiClient.delete<void>(`/api/kb/${id}`);
}
