import { apiClient } from "./client";
import type { AgentConfig } from "@/lib/types/models";

export function getAgentConfig() {
  return apiClient.get<AgentConfig>("/api/agent-config");
}
export function updateAgentConfig(patch: Partial<AgentConfig>) {
  return apiClient.patch<AgentConfig>("/api/agent-config", patch);
}
