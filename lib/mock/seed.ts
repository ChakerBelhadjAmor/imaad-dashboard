import type {
  Organization, User, AgentConfig, Customer, Conversation, Message, KBDocument, Request, AnalyticsEvent,
} from "@/lib/types/models";

export const seedOrg: Organization = {
  id: "org_1",
  name: "Riyadh Home Services",
  settings: {
    workingHours: [{ day: "Sun-Thu", open: "09:00", close: "18:00" }],
    timezone: "Asia/Riyadh",
    tone: "professional",
    language: "en",
  },
  contactInfo: { email: "hello@riyadhhome.example", phone: "+966500000000" },
  allowedOrigins: ["https://riyadhhome.example"],
  widgetKey: "wk_demo_123",
};

export const seedUser: User = {
  id: "user_1",
  organizationId: "org_1",
  name: "Sara Al-Faisal",
  email: "sara@riyadhhome.example",
  role: "org_owner",
  createdAt: "2026-08-01T09:00:00.000Z",
};

export const seedAgentConfig: AgentConfig = {
  id: "agent_1",
  organizationId: "org_1",
  name: "Layla",
  avatar: "/avatars/layla.png",
  toneOfVoice: "warm and professional",
  services: [
    { name: "AC Repair", description: "Diagnose and fix residential AC units", price: 150 },
    { name: "Deep Cleaning", description: "Full home deep cleaning service", price: 300 },
  ],
  policies: [{ title: "Cancellation", content: "Cancellations within 24 hours are free of charge." }],
  workingHours: [{ day: "Sun-Thu", open: "09:00", close: "18:00" }],
  escalationRules: [{ condition: "Customer requests a refund", action: "Escalate to human agent" }],
  allowedActions: ["book_appointment", "quote_price"],
};

export const seedCustomers: Customer[] = [
  { id: "cust_1", organizationId: "org_1", name: "Omar Khaled", phone: "+966511111111", channel: "web_widget" },
  { id: "cust_2", organizationId: "org_1", name: "Nora Saeed", email: "nora@example.com", channel: "whatsapp" },
];

export const seedConversations: Conversation[] = [
  {
    id: "conv_1",
    organizationId: "org_1",
    customerId: "cust_1",
    customer: { id: "cust_1", name: "Omar Khaled", channel: "web_widget" },
    status: "escalated",
    channel: "web_widget",
    lastMessagePreview: "I want a refund for the last visit.",
    updatedAt: "2026-09-14T08:00:00.000Z",
    createdAt: "2026-09-14T07:50:00.000Z",
  },
  {
    id: "conv_2",
    organizationId: "org_1",
    customerId: "cust_2",
    customer: { id: "cust_2", name: "Nora Saeed", channel: "whatsapp" },
    status: "active",
    channel: "whatsapp",
    lastMessagePreview: "What time can you come tomorrow?",
    updatedAt: "2026-09-14T07:30:00.000Z",
    createdAt: "2026-09-14T07:20:00.000Z",
  },
];

export const seedMessages: Record<string, Message[]> = {
  conv_1: [
    { id: "msg_1", conversationId: "conv_1", sender: "customer", content: "I want a refund for the last visit.", createdAt: "2026-09-14T07:55:00.000Z" },
    { id: "msg_2", conversationId: "conv_1", sender: "ai_agent", content: "I understand — let me connect you with a team member.", createdAt: "2026-09-14T07:56:00.000Z" },
  ],
  conv_2: [
    { id: "msg_3", conversationId: "conv_2", sender: "customer", content: "What time can you come tomorrow?", createdAt: "2026-09-14T07:20:00.000Z" },
    { id: "msg_4", conversationId: "conv_2", sender: "ai_agent", content: "We have a slot at 10 AM or 2 PM — which works better?", createdAt: "2026-09-14T07:21:00.000Z" },
  ],
};

export const seedKbDocuments: KBDocument[] = [
  { id: "kb_1", organizationId: "org_1", title: "Service Area Coverage", type: "text", status: "ready", createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-01T00:02:00.000Z" },
];

export const seedRequests: Request[] = [
  { id: "req_1", organizationId: "org_1", conversationId: "conv_1", type: "complaint", status: "open", summary: "Refund request for last visit", createdAt: "2026-09-14T07:56:00.000Z" },
];

export const seedAnalyticsEvents: AnalyticsEvent[] = [
  { id: "ev_1", organizationId: "org_1", type: "conversation_started", createdAt: "2026-09-14T07:20:00.000Z" },
  { id: "ev_2", organizationId: "org_1", type: "resolved_by_ai", createdAt: "2026-09-13T12:00:00.000Z" },
  { id: "ev_3", organizationId: "org_1", type: "escalated", createdAt: "2026-09-14T07:55:00.000Z" },
  { id: "ev_4", organizationId: "org_1", type: "response_time", value: 42, createdAt: "2026-09-14T07:21:00.000Z" },
];
