import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { analyzeAndUpload, createStoryboard, generateVideo } from "./ai-video-client";
import { creators, emptyProduct } from "./create-video-constants";
import {
  getErrorMessage,
  mapStudioSceneToAiScene,
  sortUploadedFiles,
} from "./create-video-helpers";
import type { Phase, Product, Scene, Upload, UploadKind } from "./create-video-types";
import { mapAiScene } from "./map-ai-scene";

export function useCreateVideoStudio() {
  const [phase, setPhase] = useState<Phase>("product");
  const [product, setProduct] = useState<Product>(emptyProduct);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const uploadsRef = useRef<Upload[]>([]);
  const storyboardKeyRef = useRef<string | null>(null);
  const renderKeyRef = useRef<string | null>(null);
  const [creator, setCreator] = useState("nadia");
  const [duration, setDuration] = useState(18);
  const [quality, setQuality] = useState("standard");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [referenceAssets, setReferenceAssets] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const creatorName = useMemo(
    () => creators.find((item) => item.id === creator)?.name ?? "Nadia",
    [creator],
  );

  useEffect(() => {
    uploadsRef.current = uploads;
  }, [uploads]);

  useEffect(
    () => () => {
      uploadsRef.current.forEach((upload) => URL.revokeObjectURL(upload.url));
    },
    [],
  );

  useEffect(() => {
    if (phase !== "analyzing" && phase !== "scene-loading") return;

    const timer = window.setInterval(() => setProgress((value) => Math.min(90, value + 4)), 500);

    return () => window.clearInterval(timer);
  }, [phase]);

  const handleUpload = (kind: UploadKind, event: ChangeEvent<HTMLInputElement>) => {
    const additions = createUploads(kind, event.target.files, uploads);
    setUploads([...uploads, ...additions]);
    event.target.value = "";
  };

  const removeUpload = (id: string) => {
    const removed = uploads.find((upload) => upload.id === id);
    if (removed) URL.revokeObjectURL(removed.url);

    setUploads(selectUploadsAfterRemoval(uploads, id));
  };

  const analyze = async () => {
    setError(null);
    setProgress(5);
    setPhase("analyzing");

    try {
      const result = await analyzeAndUpload(sortUploadedFiles(uploads));
      setProduct(result.product);
      setReferenceAssets(result.assets);
      setProgress(100);
      setPhase("review");
    } catch (caught) {
      setError(getErrorMessage(caught, "Product analysis failed"));
      setPhase("product");
    }
  };

  const storyboard = async () => {
    setError(null);
    setProgress(5);
    setPhase("scene-loading");

    try {
      storyboardKeyRef.current ??= crypto.randomUUID();
      const result = await createStoryboard(
        {
          product,
          creator,
          duration: duration as 12 | 18 | 25,
          quality: quality as "economy" | "standard" | "premium",
          referenceAssets,
        },
        fetch,
        storyboardKeyRef.current,
      );

      setProjectId(result.project.id);
      setScenes(result.scenes.map(mapAiScene));
      storyboardKeyRef.current = null;
      setProgress(100);
      setPhase("scenes");
    } catch (caught) {
      setError(getErrorMessage(caught, "Storyboard generation failed"));
      setPhase("talent");
    }
  };

  const render = async () => {
    if (!projectId) return;

    setError(null);
    setProgress(5);
    setPhase("rendering");

    try {
      renderKeyRef.current ??= crypto.randomUUID();
      const result = await generateVideo({
        projectId,
        referenceAssets,
        scenes: scenes.map(mapStudioSceneToAiScene),
        onProgress: setProgress,
        idempotencyKey: renderKeyRef.current,
      });

      renderKeyRef.current = null;
      setVideoUrl(result.videoUrl);
      setPhase("result");
    } catch (caught) {
      setError(getErrorMessage(caught, "Video generation failed"));
      setPhase("scenes");
    }
  };

  const restart = () => {
    uploads.forEach((upload) => URL.revokeObjectURL(upload.url));
    setUploads([]);
    setProduct(emptyProduct);
    setPhase("product");
    setScenes([]);
    setProjectId(null);
    setReferenceAssets([]);
    setVideoUrl(null);
    setError(null);
    setProgress(0);
  };

  return {
    phase,
    setPhase,
    product,
    setProduct,
    uploads,
    setUploads,
    creator,
    setCreator,
    creatorName,
    duration,
    setDuration,
    quality,
    setQuality,
    scenes,
    setScenes,
    videoUrl,
    error,
    progress,
    handleUpload,
    removeUpload,
    analyze,
    storyboard,
    render,
    restart,
  };
}

function createUploads(kind: UploadKind, files: FileList | null, uploads: Upload[]): Upload[] {
  const currentKindCount = uploads.filter((upload) => upload.kind === kind).length;
  const hasMainProduct = uploads.some((upload) => upload.kind === "product" && upload.main);

  return Array.from(files ?? [])
    .slice(0, Math.max(0, 4 - currentKindCount))
    .map((file, index) => ({
      id: `${kind}-${file.name}-${file.lastModified}-${index}`,
      name: file.name,
      url: URL.createObjectURL(file),
      main: kind === "product" && !hasMainProduct && index === 0,
      kind,
      file,
    }));
}

function selectUploadsAfterRemoval(uploads: Upload[], id: string) {
  const removed = uploads.find((upload) => upload.id === id);
  const next = uploads.filter((upload) => upload.id !== id);
  const nextProduct = next.findIndex((upload) => upload.kind === "product");

  if (removed?.main && nextProduct >= 0) {
    next[nextProduct] = { ...next[nextProduct], main: true };
  }

  return next;
}
