import { createAuthServices } from "@/application/auth/services";
import { AiDomainError } from "@/domain/ai/errors";
import { timingSafeEqual } from "node:crypto";
import { ZodError } from "zod";

export async function authenticated() {
  const { authProvider } = await createAuthServices();
  const user = await authProvider.getCurrentUser();
  if (!user) throw new ApiError(401, "AUTH_REQUIRED", "Authentication required");
  return user;
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export function failure(error: unknown) {
  if (error instanceof ApiError || error instanceof AiDomainError) {
    return Response.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return Response.json({ error: { code: "INVALID_REQUEST", message: "Request validation failed" } }, { status: 400 });
  }
  if (error instanceof Error && error.message.includes("INSUFFICIENT_CREDITS")) {
    return Response.json({ error: { code: "INSUFFICIENT_CREDITS", message: "Insufficient credits" } }, { status: 402 });
  }
  return Response.json({ error: { code: "INTERNAL_ERROR", message: "The request could not be completed" } }, { status: 500 });
}

export function workerAuthorized(value: string | null, secret = process.env.AI_WORKER_SECRET) {
  if (!value || !secret) return false;
  const supplied = Buffer.from(value.replace(/^Bearer\s+/i, ""));
  const expected = Buffer.from(secret);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
