import { describe, expect, it } from "vitest";
import { imageRequestSchema, sceneUpdateSchema, storyboardRequestSchema, videoRequestSchema } from "./ai-request-schemas";
import { parseImageFiles } from "./ai-upload-schema";

const product = {
  name: "x",
  description: "x",
  category: "x",
  audience: "x",
  sellingPoint: "x",
  offer: "",
  cta: "x",
  keyMessage: "x",
  concept: "x",
};
const validPath = "ai/00000000-0000-4000-8000-000000000000/references/file.png";

const formDataWithFile = (size: number) => {
  const formData = new FormData();
  formData.append("images", new File([new Uint8Array(size)], "image.png", { type: "image/png" }));
  return formData;
};

describe("AI request schemas", () => {
  it("rejects unsupported duration", () => {
    expect(() => storyboardRequestSchema.parse({ product, creator: "n", duration: 20 })).toThrow();
  });

  it("rejects nine reference assets", () => {
    expect(() => storyboardRequestSchema.parse({ product, creator: "n", duration: 12, referenceAssets: Array(9).fill(validPath) })).toThrow();
  });

  it("requires useful image idempotency keys", () => {
    expect(() => imageRequestSchema.parse({ idempotencyKey: "short" })).toThrow();
  });

  it("requires useful video idempotency keys", () => {
    expect(() => videoRequestSchema.parse({ idempotencyKey: "short" })).toThrow();
  });

  it("does not accept empty scene edits", () => {
    expect(() => sceneUpdateSchema.parse({})).toThrow();
  });

  it("accepts private reference paths", () => {
    expect(storyboardRequestSchema.safeParse({ product, creator: "n", duration: 12, referenceAssets: [validPath] }).success).toBe(true);
  });

  it("rejects remote reference URLs", () => {
    expect(storyboardRequestSchema.safeParse({ product, creator: "n", duration: 12, referenceAssets: ["https://storage.example/file.png"] }).success).toBe(false);
  });

  it("rejects paths outside reference namespace", () => {
    expect(storyboardRequestSchema.safeParse({ product, creator: "n", duration: 12, referenceAssets: ["ai/other/path.png"] }).success).toBe(false);
  });

  it("rejects files larger than 8 MiB", () => {
    expect(() => parseImageFiles(formDataWithFile(8 * 1024 * 1024 + 1))).toThrow();
  });
});
