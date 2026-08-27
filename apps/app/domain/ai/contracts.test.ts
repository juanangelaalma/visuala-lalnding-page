import { describe, expect, expectTypeOf, it } from "vitest";
import type { AiGenerationRepository, AiProjectRepository, AiSceneRepository, AiWorkerRepository } from "./contracts";
import { AiDomainError } from "./errors";

describe("AI domain boundary", () => {
  it("preserves error status and code", () => {
    const error = new AiDomainError(404, "NOT_FOUND", "Project not found");

    expect(error).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("accepts camelCase project models at repository boundary", () => {
    expectTypeOf<AiProjectRepository>().toHaveProperty("findOwnedById");
  });

  it("allows scene type and motion complexity updates", () => {
    expectTypeOf<{
      sceneType?: "benefit";
      motionComplexity?: "low";
    }>().toMatchTypeOf<Parameters<AiSceneRepository["update"]>[1]>();
  });

  it("checks generation history by scene", () => {
    expectTypeOf<AiGenerationRepository>().toHaveProperty("hasGenerationHistoryForScene");
  });

  it("reserves credits and finds latest scene generation", () => {
    expectTypeOf<AiGenerationRepository>().toHaveProperty("reserveCredits");
    expectTypeOf<AiGenerationRepository>().toHaveProperty("findLatestBySceneIdAndTypes");
  });

  it("defines the worker persistence port at the domain boundary", () => {
    expectTypeOf<AiWorkerRepository>().toHaveProperty("claimWork");
    expectTypeOf<AiWorkerRepository>().toHaveProperty("recordFailure");
  });
});
