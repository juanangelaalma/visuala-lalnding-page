import type { AiScene } from "./ai-video-client";
import type { Scene } from "./create-video-types";

export function mapAiScene(scene: AiScene): Scene {
  return {
    id: scene.id,
    title: scene.title,
    duration: scene.durationSeconds,
    visual: scene.imagePrompt,
    dialogue: scene.dialogue,
    sceneType: scene.sceneType,
    motionComplexity: scene.motionComplexity,
    videoPrompt: scene.videoPrompt,
    negativePrompt: scene.negativePrompt,
  };
}
