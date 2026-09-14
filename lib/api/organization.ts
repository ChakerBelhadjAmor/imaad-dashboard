import { apiClient } from "./client";
import type { Organization } from "@/lib/types/models";

export function getOrganization() {
  return apiClient.get<Organization>("/api/organization");
}
export function updateOrganization(patch: Partial<Organization>) {
  return apiClient.patch<Organization>("/api/organization", patch);
}
