import { ApiError } from "@/lib/api/client";
import { copy } from "@/lib/copy/en";

export function mapApiErrorToFieldErrors(error: unknown): Record<string, string> {
  if (error instanceof ApiError) {
    if (error.status === 400 && error.body.details?.length) {
      return Object.fromEntries(error.body.details.map((d) => [d.field, d.message]));
    }
    if (error.status === 429) return { _form: copy.auth.rateLimited };
    return { _form: error.body.error || copy.auth.genericError };
  }
  return { _form: copy.auth.genericError };
}
