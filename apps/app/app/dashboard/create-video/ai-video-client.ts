export type AiProduct = {
  name: string;
  description: string;
  category: string;
  audience: string;
  sellingPoint: string;
  offer: string;
  cta: string;
  keyMessage: string;
  concept: string;
};

export type AiScene = {
  id: string;
  position: number;
  title: string;
  sceneType: string;
  motionComplexity: string;
  imagePrompt: string;
  videoPrompt: string;
  negativePrompt: string;
  dialogue: string;
  durationSeconds: number;
  approvedImageGenerationId: string | null;
};

type Generation = {
  id: string;
  sceneId: string | null;
  type: string;
  status: string;
  assets: string[];
  errorCode: string | null;
};

type ProjectStatus = {
  project: { id: string; status: string };
  scenes: AiScene[];
  generations: Generation[];
};

type Fetch = typeof fetch;
type Delay = (milliseconds: number) => Promise<void>;

async function api<T>(fetcher: Fetch, input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetcher(input, init);
  const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
  if (!response.ok) throw new Error(body?.error?.message || "The AI request could not be completed");
  return body as T;
}

function imageForm(files: File[]) {
  const form = new FormData();
  files.forEach((file) => form.append("images", file));
  return form;
}

export async function analyzeAndUpload(files: File[], fetcher: Fetch = fetch) {
  const [analysis, upload] = await Promise.all([
    api<{ product: AiProduct }>(fetcher, "/api/ai/analyze", { method: "POST", body: imageForm(files) }),
    api<{ assets: string[] }>(fetcher, "/api/ai/assets", { method: "POST", body: imageForm(files) }),
  ]);
  return { product: analysis.product, assets: upload.assets };
}

export async function createStoryboard(input: {
  product: AiProduct;
  creator: string;
  duration: 12 | 18 | 25;
  quality: "economy" | "standard" | "premium";
  referenceAssets: string[];
}, fetcher: Fetch = fetch, idempotencyKey = crypto.randomUUID()) {
  return api<{ project: { id: string }; scenes: AiScene[] }>(fetcher, "/api/ai/projects/storyboard", {
    method: "POST",
    headers: { "content-type": "application/json", "idempotency-key": idempotencyKey },
    body: JSON.stringify(input),
  });
}

const terminalStatuses = new Set(["succeeded", "failed", "cancelled", "dead_letter", "unknown"]);

async function waitForGenerations(
  projectId: string,
  generationIds: string[],
  fetcher: Fetch,
  delay: Delay,
  attempts = 200,
) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const status = await api<ProjectStatus>(fetcher, `/api/ai/projects/${projectId}/status`);
    const generations = generationIds.map((id) => status.generations.find((item) => item.id === id));
    if (generations.some((item) => item && terminalStatuses.has(item.status) && item.status !== "succeeded")) {
      throw new Error("One or more AI generations failed. Please try again.");
    }
    if (generations.every((item) => item?.status === "succeeded")) return { status, generations: generations as Generation[] };
    await delay(3_000);
  }
  throw new Error("AI generation is taking too long. Please try again later.");
}

export async function generateVideo(input: {
  projectId: string;
  scenes: AiScene[];
  referenceAssets: string[];
  onProgress?: (progress: number) => void;
  idempotencyKey?: string;
}, fetcher: Fetch = fetch, delay: Delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))) {
  const { projectId, scenes, referenceAssets, onProgress, idempotencyKey = crypto.randomUUID() } = input;
  await Promise.all(scenes.map((scene) => api(fetcher, `/api/ai/scenes/${scene.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: scene.title,
      imagePrompt: scene.imagePrompt,
      videoPrompt: scene.videoPrompt,
      negativePrompt: scene.negativePrompt,
      dialogue: scene.dialogue,
      durationSeconds: scene.durationSeconds,
    }),
  })));
  onProgress?.(15);

  const imageRequests = await Promise.all(scenes.map((scene) => api<{ generation: Generation }>(fetcher, `/api/ai/scenes/${scene.id}/image`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ references: referenceAssets, idempotencyKey: `${idempotencyKey}:image:${scene.id}`, maxEstimatedCostUsd: 0.1 }),
  })));
  onProgress?.(30);
  const images = await waitForGenerations(projectId, imageRequests.map((item) => item.generation.id), fetcher, delay);
  onProgress?.(55);

  await Promise.all(images.generations.map((generation) => api(fetcher, `/api/ai/scenes/${generation.sceneId}/approve`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ generationId: generation.id }),
  })));
  const videoRequest = await api<{ generations: Generation[] }>(fetcher, `/api/ai/projects/${projectId}/video`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idempotencyKey: `${idempotencyKey}:video`, maxEstimatedCostUsd: 5 }),
  });
  onProgress?.(70);

  const remoteVideos = videoRequest.generations.filter((generation) => generation.type === "video");
  if (!remoteVideos.length) {
    onProgress?.(100);
    return { videoUrl: null, status: images.status };
  }
  const videos = await waitForGenerations(projectId, remoteVideos.map((generation) => generation.id), fetcher, delay);
  onProgress?.(100);
  return { videoUrl: videos.generations.flatMap((generation) => generation.assets)[0] ?? null, status: videos.status };
}
