import { describe, expect, expectTypeOf, it } from "vitest";
import type { AiProjectRepository } from "./contracts";
import { AiDomainError } from "./errors";

describe("AI domain boundary", () => {
  it("preserves error status and code", () => {
    const error = new AiDomainError(404, "NOT_FOUND", "Project not found");

    expect(error).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("accepts camelCase project models at repository boundary", () => {
    expectTypeOf<AiProjectRepository>().toHaveProperty("findOwnedById");
  });
});
