import { randomUUID } from "node:crypto";
import { imageFileExtension, InvalidImagesError, parseImageFiles } from "@/features/ai/schemas/ai-upload-schema";
import { uploadAsset } from "@/infrastructure/ai/supabase-assets";
import { ApiError, authenticated, failure } from "../_shared";

export async function POST(request: Request) {
  try {
    const user = await authenticated();
    const form = await request.formData();
    let files: File[];
    try {
      files = parseImageFiles(form);
    } catch (error) {
      if (error instanceof InvalidImagesError) throw new ApiError(400, "INVALID_IMAGES", error.message);
      throw error;
    }

    const assets = await Promise.all(files.map(async (file) => {
      const extension = imageFileExtension(file);
      const key = `ai/${user.id}/references/${randomUUID()}.${extension}`;
      return uploadAsset(new Uint8Array(await file.arrayBuffer()), file.type, key);
    }));
    return Response.json({ assets }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
