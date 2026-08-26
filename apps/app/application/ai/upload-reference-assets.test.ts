import { describe, expect, it, vi } from "vitest";
import { uploadReferenceAssets } from "./upload-reference-assets";

describe("uploadReferenceAssets", () => {
  it("uploads files to owner reference paths", async () => {
    const upload = vi.fn().mockResolvedValue({ path: "ai/user/references/file.png", contentType: "image/png" });

    const result = await uploadReferenceAssets({
      ownerId: "user",
      files: [{ body: new Uint8Array([1]), contentType: "image/png", extension: "png" }],
    }, { assets: { upload, signAssets: vi.fn() } });

    expect(result).toEqual({ assets: ["ai/user/references/file.png"] });
  });
});
