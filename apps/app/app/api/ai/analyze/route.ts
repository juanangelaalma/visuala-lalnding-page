import { createAiServices } from "@/application/ai/services";
import { parseImageFiles, InvalidImagesError } from "@/features/ai/schemas/ai-upload-schema";
import { authenticated, ApiError, failure } from "../_shared";

export async function POST(request: Request) {
  try {
    await authenticated();
    const files = parseFiles(await request.formData());
    const images = await Promise.all(files.map(async (file) => ({ mimeType: file.type, base64: Buffer.from(await file.arrayBuffer()).toString("base64") })));
    return Response.json(await createAiServices().analyzeProduct({ images }));
  } catch (error) {
    return failure(error);
  }
}

function parseFiles(formData: FormData) {
  try {
    return parseImageFiles(formData);
  } catch (error) {
    if (error instanceof InvalidImagesError) throw new ApiError(400, "INVALID_IMAGES", error.message);
    throw error;
  }
}
