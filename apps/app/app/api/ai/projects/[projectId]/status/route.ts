import { createAiServices } from "@/infrastructure/ai/services";
import { authenticated, failure } from "../../../_shared";

type Context = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const user = await authenticated();
    const { projectId } = await context.params;
    return Response.json(await createAiServices().getProjectStatus({ ownerId: user.id, projectId }));
  } catch (error) {
    return failure(error);
  }
}
