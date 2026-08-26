import { approveSceneImageSchema } from "@/features/ai/schemas/ai-request-schemas";
import { createAiServices } from "@/infrastructure/ai/services";
import { authenticated, failure } from "../../../_shared";

type Context = { params: Promise<{ sceneId: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const user = await authenticated();
    const { sceneId } = await context.params;
    const { generationId } = approveSceneImageSchema.parse(await request.json());
    const { scene } = await createAiServices().approveSceneImage({
      ownerId: user.id,
      sceneId,
      generationId,
    });
    return Response.json({ scene });
  } catch (error) {
    return failure(error);
  }
}
