import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as kb from "./kb";
import * as conversations from "./conversations";
import * as messages from "./messages";
import * as agentConfig from "./agentConfig";
import * as organization from "./organization";
import type { ConversationStatus } from "@/lib/types/models";

export function useKbDocuments() {
  return useQuery({ queryKey: ["kb"], queryFn: kb.listKbDocuments });
}
export function useCreateKbDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: kb.createKbDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kb"] }),
  });
}
export function useUploadKbDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: kb.uploadKbDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kb"] }),
  });
}
export function useReprocessKbDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: kb.reprocessKbDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kb"] }),
  });
}
export function useDeleteKbDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: kb.deleteKbDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kb"] }),
  });
}

export function useConversations(status?: ConversationStatus) {
  return useQuery({
    queryKey: ["conversations", status ?? "all"],
    queryFn: () => conversations.listConversations(status),
  });
}
export function useConversation(id: string) {
  return useQuery({ queryKey: ["conversations", id], queryFn: () => conversations.getConversation(id), enabled: !!id });
}
export function useUpdateConversationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ConversationStatus }) =>
      conversations.updateConversationStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}
export function useAssignConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => conversations.assignConversation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => messages.listMessages(conversationId),
    enabled: !!conversationId,
  });
}
export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => messages.sendMessage(conversationId, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages", conversationId] }),
  });
}

export function useAgentConfig() {
  return useQuery({ queryKey: ["agent-config"], queryFn: agentConfig.getAgentConfig });
}
export function useUpdateAgentConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: agentConfig.updateAgentConfig,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agent-config"] }),
  });
}

export function useOrganization() {
  return useQuery({ queryKey: ["organization"], queryFn: organization.getOrganization });
}
export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: organization.updateOrganization,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organization"] }),
  });
}
