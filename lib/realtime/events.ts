import type { Message, Conversation, KBDocument } from "@/lib/types/models";

export interface RealtimeEventMap {
  "message:new": Message;
  "conversation:status": Pick<Conversation, "id" | "status">;
  "conversation:escalated": Pick<Conversation, "id">;
  "conversation:assigned": Pick<Conversation, "id" | "assignedTo">;
  "notification:escalation": { conversationId: string };
  "kb:document-status": Pick<KBDocument, "id" | "status">;
}
