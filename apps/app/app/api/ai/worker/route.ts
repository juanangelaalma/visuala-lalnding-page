import { createAiServices } from "@/infrastructure/ai/services";
import { failure, workerAuthorized } from "../_shared";

export async function POST(request: Request) {
  if (!workerAuthorized(request.headers.get("authorization"))) {
    return Response.json({ error: { code: "WORKER_UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }
  try {
    return Response.json(await createAiServices().runAiWorker());
  } catch (error) {
    return failure(error);
  }
}
