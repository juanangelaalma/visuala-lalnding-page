import type { Scene, Upload } from "./create-video-types";

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function sortUploadedFiles(uploads: Pick<Upload, "file" | "main">[]) {
  return [...uploads]
    .sort((left, right) => Number(right.main) - Number(left.main))
    .map((upload) => upload.file);
}

export function mapStudioSceneToAiScene(scene: Scene, position: number) {
  return {
    id: scene.id,
    position,
    title: scene.title,
    sceneType: scene.sceneType,
    motionComplexity: scene.motionComplexity,
    imagePrompt: scene.visual,
    videoPrompt: scene.videoPrompt,
    negativePrompt: scene.negativePrompt,
    dialogue: scene.dialogue,
    durationSeconds: scene.duration,
    approvedImageGenerationId: null,
  };
}
