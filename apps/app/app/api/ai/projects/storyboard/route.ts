import { createAiServices } from "@/infrastructure/ai/services";
import { storyboardRequestSchema } from "@/features/ai/schemas/ai-request-schemas";
import { ApiError, authenticated, failure } from "../../_shared";

export async function POST(request: Request) {
  try {
    const user = await authenticated();
    const idempotencyKey = request.headers.get("idempotency-key");
    if (!idempotencyKey || idempotencyKey.length < 8) throw new ApiError(400, "IDEMPOTENCY_KEY_REQUIRED", "A valid Idempotency-Key is required");
    const input = storyboardRequestSchema.parse(await request.json());
    if (!input.referenceAssets.every((path) => path.startsWith(`ai/${user.id}/references/`))) throw new ApiError(403, "REFERENCE_ASSET_FORBIDDEN", "Reference assets must belong to the authenticated user");
    const result = await createAiServices().createStoryboard({ ...input, ownerId: user.id, idempotencyKey });
    return Response.json({ project: result.project, scenes: result.scenes }, { status: result.status });
  } catch (error) {
    return failure(error);
  }
}
