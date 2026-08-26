import { createAiServices } from "@/infrastructure/ai/services";
import { imageRequestSchema } from "@/features/ai/schemas/ai-request-schemas";
import { authenticated, failure } from "../../../_shared";

type Context = { params: Promise<{ sceneId: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const user = await authenticated();
    const { sceneId } = await context.params;
    const input = imageRequestSchema.parse(await request.json());
    const result = await createAiServices().queueSceneImage({ ...input, ownerId: user.id, sceneId });
    return Response.json({ generation: result.generation }, { status: result.status });
  } catch (error) {
    return failure(error);
  }
}
