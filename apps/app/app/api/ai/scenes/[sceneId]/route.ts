import { sceneUpdateSchema } from "@/features/ai/schemas/ai-request-schemas";
import { createAiServices } from "@/infrastructure/ai/services";
import { authenticated, failure } from "../../_shared";

type Context = { params: Promise<{ sceneId: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await authenticated();
    const { sceneId } = await context.params;
    const input = sceneUpdateSchema.parse(await request.json());
    const { scene } = await createAiServices().updateScene({
      ownerId: user.id,
      sceneId,
      ...input,
    });
    return Response.json({
      scene: {
        id: scene.id,
        position: scene.position,
        title: scene.title,
        sceneType: scene.sceneType,
        motionComplexity: scene.motionComplexity,
        imagePrompt: scene.imagePrompt,
        videoPrompt: scene.videoPrompt,
        negativePrompt: scene.negativePrompt,
        dialogue: scene.dialogue,
        durationSeconds: scene.duration,
        approvedImageGenerationId: scene.approvedImageGenerationId,
      },
    });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const user = await authenticated();
    const { sceneId } = await context.params;
    await createAiServices().deleteScene({ ownerId: user.id, sceneId });
    return new Response(null, { status: 204 });
  } catch (error) {
    return failure(error);
  }
}
