import { createAiServices } from "@/infrastructure/ai/services";
import { videoRequestSchema } from "@/features/ai/schemas/ai-request-schemas";
import { authenticated, failure } from "../../../_shared";

type Context = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const user = await authenticated();
    const { projectId } = await context.params;
    const input = videoRequestSchema.parse(await request.json());
    const result = await createAiServices().queueProjectVideo({ ...input, ownerId: user.id, projectId });
    return Response.json({ generations: result.generations, batch: result.batch, composition: result.composition }, { status: result.status });
  } catch (error) {
    return failure(error);
  }
}
