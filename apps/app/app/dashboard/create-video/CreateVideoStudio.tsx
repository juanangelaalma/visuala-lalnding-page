"use client";

import {
  LoadingView,
  ProductAnalysis,
  ProductReview,
  ProductSetup,
  SceneEditor,
  Stepper,
  TalentSetup,
  VideoResult,
} from "./CreateVideoSteps";
import { useCreateVideoStudio } from "./use-create-video-studio";

export default function CreateVideoStudio() {
  const studio = useCreateVideoStudio();

  return (
    <section className="min-h-full rounded-3xl bg-black text-white">
      <Stepper phase={studio.phase} />
      <div className="rounded-3xl bg-pricing-bg/50 p-4 sm:p-6 lg:p-8">
        {studio.error ? (
          <p
            role="alert"
            className="mb-6 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-white"
          >
            {studio.error}
          </p>
        ) : null}
        <CreateVideoPhase studio={studio} />
      </div>
    </section>
  );
}

function CreateVideoPhase({ studio }: { studio: ReturnType<typeof useCreateVideoStudio> }) {
  switch (studio.phase) {
    case "product":
      return (
        <ProductSetup
          uploads={studio.uploads}
          onUpload={studio.handleUpload}
          onRemove={studio.removeUpload}
          onMain={(id) =>
            studio.setUploads(
              studio.uploads.map((upload) => ({
                ...upload,
                main: upload.kind === "product" && upload.id === id,
              })),
            )
          }
          onContinue={studio.analyze}
        />
      );
    case "analyzing":
      return <ProductAnalysis progress={studio.progress} />;
    case "review":
      return (
        <ProductReview
          product={studio.product}
          setProduct={studio.setProduct}
          uploads={studio.uploads}
          onBack={() => studio.setPhase("product")}
          onContinue={() => studio.setPhase("talent")}
        />
      );
    case "talent":
      return (
        <TalentSetup
          creator={studio.creator}
          setCreator={studio.setCreator}
          duration={studio.duration}
          setDuration={studio.setDuration}
          quality={studio.quality}
          setQuality={studio.setQuality}
          onBack={() => studio.setPhase("review")}
          onGenerate={studio.storyboard}
        />
      );
    case "scene-loading":
      return <LoadingView kind="scenes" progress={studio.progress} scenes={studio.scenes} />;
    case "scenes":
      return (
        <SceneEditor
          scenes={studio.scenes}
          setScenes={studio.setScenes}
          product={studio.product}
          creatorName={studio.creatorName}
          duration={studio.duration}
          onBack={() => studio.setPhase("talent")}
          onRender={studio.render}
        />
      );
    case "rendering":
      return <LoadingView kind="video" progress={studio.progress} scenes={studio.scenes} />;
    case "result":
      return (
        <VideoResult
          product={studio.product}
          creatorName={studio.creatorName}
          duration={studio.duration}
          scenes={studio.scenes}
          videoUrl={studio.videoUrl}
          onRestart={studio.restart}
          onEdit={() => studio.setPhase("scenes")}
        />
      );
  }
}
