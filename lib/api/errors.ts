import type { ApiErrorBody } from "@/lib/types/models";

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}
