export type UserRole = "org_owner" | "org_admin" | "org_agent" | "super_admin";

export interface Organization {
  id: string;
  name: string;
  settings: {
    workingHours: { day: string; open: string; close: string }[];
    timezone: string;
    tone: string;
    language: "en";
  };
  contactInfo: { email: string; phone?: string };
  allowedOrigins: string[];
  whatsapp?: { phoneNumber: string; enabled: boolean };
  widgetKey: string;
}

export interface User {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface AgentService {
  name: string;
  description: string;
  price: number;
}

export interface AgentPolicy {
  title: string;
  content: string;
}

export interface EscalationRule {
  condition: string;
  action: string;
}

export interface AgentConfig {
  id: string;
  organizationId: string;
  name: string;
  avatar: string;
  toneOfVoice: string;
  services: AgentService[];
  policies: AgentPolicy[];
  workingHours: { day: string; open: string; close: string }[];
  escalationRules: EscalationRule[];
  allowedActions: string[];
}

export type CustomerChannel = "web_widget" | "whatsapp";

export interface Customer {
  id: string;
  organizationId: string;
  name: string;
  phone?: string;
  email?: string;
  channel: CustomerChannel;
}

export type ConversationStatus = "active" | "escalated" | "resolved";

export interface Conversation {
  id: string;
  organizationId: string;
  customerId: string;
  customer: Pick<Customer, "id" | "name" | "channel">;
  status: ConversationStatus;
  channel: CustomerChannel;
  assignedTo?: string;
  lastMessagePreview: string;
  updatedAt: string;
  createdAt: string;
}

export type MessageSender = "customer" | "ai_agent" | "human_agent";

export interface Message {
  id: string;
  conversationId: string;
  sender: MessageSender;
  content: string;
  createdAt: string;
}

export type KBDocumentStatus = "pending" | "processing" | "ready" | "failed";

export interface KBDocument {
  id: string;
  organizationId: string;
  title: string;
  type: "text" | "pdf";
  status: KBDocumentStatus;
  createdAt: string;
  updatedAt: string;
}

export type RequestType = "booking" | "inquiry" | "complaint" | "order_status" | "other";
export type RequestStatus = "open" | "in_progress" | "closed";

export interface Request {
  id: string;
  organizationId: string;
  conversationId: string;
  type: RequestType;
  status: RequestStatus;
  summary: string;
  createdAt: string;
}

export type AnalyticsEventType = "conversation_started" | "resolved_by_ai" | "escalated" | "response_time";

export interface AnalyticsEvent {
  id: string;
  organizationId: string;
  type: AnalyticsEventType;
  value?: number;
  createdAt: string;
}

export interface ApiErrorBody {
  error: string;
  details?: { field: string; message: string }[];
}
