import { randomUUID } from "node:crypto";
import { uploadAsset } from "@/infrastructure/ai/r2-assets";
import { ApiError, authenticated, failure } from "../_shared";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const maxBytes = 8 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const user = await authenticated();
    const form = await request.formData();
    const files = form.getAll("images").filter((value): value is File => value instanceof File);
    if (files.length < 1 || files.length > 8) throw new ApiError(400, "INVALID_IMAGES", "Upload 1 to 8 images");
    if (files.some((file) => !allowedTypes.has(file.type) || file.size > maxBytes)) {
      throw new ApiError(400, "INVALID_IMAGES", "Images must be JPG, PNG or WEBP and no larger than 8 MB");
    }

    const assets = await Promise.all(files.map(async (file) => {
      const extension = allowedTypes.get(file.type)!;
      const key = `ai/${user.id}/references/${randomUUID()}.${extension}`;
      return uploadAsset(new Uint8Array(await file.arrayBuffer()), file.type, key);
    }));
    return Response.json({ assets }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
