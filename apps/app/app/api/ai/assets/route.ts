import { createAiServices } from "@/infrastructure/ai/services";
import { imageFileExtension, InvalidImagesError, parseImageFiles } from "@/features/ai/schemas/ai-upload-schema";
import { ApiError, authenticated, failure } from "../_shared";

export async function POST(request: Request) {
  try {
    const user = await authenticated();
    const files = parseFiles(await request.formData());
    const input = await Promise.all(files.map(async (file) => ({
      body: new Uint8Array(await file.arrayBuffer()),
      contentType: file.type,
      extension: imageFileExtension(file),
    })));
    return Response.json(await createAiServices().uploadReferenceAssets({ ownerId: user.id, files: input }), { status: 201 });
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
