import type { AiProduct } from "./ai-video-client";

export type Phase =
  | "product"
  | "analyzing"
  | "review"
  | "talent"
  | "scene-loading"
  | "scenes"
  | "rendering"
  | "result";
export type Product = AiProduct;
export type UploadKind = "product" | "listing";
export type Upload = {
  id: string;
  name: string;
  url: string;
  main: boolean;
  kind: UploadKind;
  file: File;
};
export type Scene = {
  id: string;
  title: string;
  duration: number;
  visual: string;
  dialogue: string;
  sceneType: string;
  motionComplexity: string;
  videoPrompt: string;
  negativePrompt: string;
};
