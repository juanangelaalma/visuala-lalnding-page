import { randomUUID } from "node:crypto";
import type { AiAssetRepository } from "@/domain/ai/contracts";

export async function uploadReferenceAssets(
  input: { ownerId: string; files: { body: Uint8Array; contentType: string; extension: string }[] },
  deps: { assets: AiAssetRepository },
): Promise<{ assets: string[] }> {
  const uploaded = await Promise.all(input.files.map((file) => deps.assets.upload({
    userId: input.ownerId,
    body: file.body,
    contentType: file.contentType,
    path: `ai/${input.ownerId}/references/${randomUUID()}.${file.extension}`,
  })));
  return { assets: uploaded.map((asset) => asset.path) };
}
