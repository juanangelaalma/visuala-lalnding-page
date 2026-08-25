import { Button } from "@visuala/ui";
import { useState } from "react";
import { panel } from "./create-video-constants";
import type { Product, Scene } from "./create-video-types";
import { Header, Icon } from "./CreateVideoPrimitives";

export function VideoResult({
  product,
  creatorName,
  duration,
  scenes,
  videoUrl,
  onRestart,
  onEdit,
}: {
  product: Product;
  creatorName: string;
  duration: number;
  scenes: Scene[];
  videoUrl: string | null;
  onRestart: () => void;
  onEdit: () => void;
}) {
  const [summaryOpen, setSummaryOpen] = useState(false);
  return (
    <>
      <Header
        eyebrow={videoUrl ? "Video complete" : "Scenes complete"}
        title={videoUrl ? "Your affiliate video is ready" : "Your scene assets are ready"}
        copy={
          videoUrl
            ? "Preview the generated output, inspect its scenes, or start another version."
            : "The backend generated and approved every scene image. Final local composition is waiting for the composer service."
        }
      />
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/[.07] p-4 text-sm text-primary">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-black">
          <Icon name="check" className="h-4 w-4" />
        </span>
        {videoUrl
          ? "Video generated successfully"
          : "Scene generation completed; composition is queued"}
      </div>
      <div className="grid gap-8 xl:grid-cols-[minmax(300px,420px)_1fr]">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="relative aspect-[9/16] overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_50%_30%,#454817_0%,#1c1d0e_25%,#070707_70%)] shadow-2xl">
            {videoUrl ? (
              <video controls playsInline src={videoUrl} className="h-full w-full object-cover">
                Generated video preview
              </video>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                <span className="text-xs font-semibold uppercase tracking-[.3em] text-primary">
                  Composition queued
                </span>
                <strong className="mt-4 font-display text-2xl uppercase text-white">
                  {product.name}
                </strong>
                <p className="mt-3 text-sm leading-6 text-white/60">
                  The composer service will combine the generated scene assets.
                </p>
              </div>
            )}
          </div>
        </div>
        <section className={`${panel} p-5 sm:p-7`}>
          <h2 className="font-display text-2xl font-semibold uppercase text-white">
            {product.name}
          </h2>
          <p className="mt-2 text-sm text-neutral-450">Affiliate video · AI output</p>
          <dl className="mt-7 divide-y divide-white/[.07]">
            {[
              ["Creator", creatorName],
              ["Duration", `${duration} seconds`],
              ["Scenes", String(scenes.length)],
              ["Format", "Vertical · 9:16"],
              ["Status", videoUrl ? "Ready" : "Composition waiting"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-4">
                <dt className="text-sm text-neutral-500">{label}</dt>
                <dd className="text-right text-sm font-semibold text-white">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {videoUrl ? (
              <Button href={videoUrl} target="_blank" rel="noopener noreferrer">
                Download video
              </Button>
            ) : null}
            <Button variant="outline" tone="light" onClick={onRestart}>
              Create another
            </Button>
            <Button variant="outline" tone="light" onClick={onEdit}>
              Edit scenes
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setSummaryOpen(!summaryOpen)}
            className="mt-7 flex w-full items-center justify-between border-t border-white/10 pt-5 text-sm font-semibold text-white"
          >
            Scene summary{" "}
            <Icon
              name="chevron"
              className={`h-4 w-4 transition ${summaryOpen ? "rotate-180" : ""}`}
            />
          </button>
          {summaryOpen ? (
            <ol className="mt-4 grid gap-3">
              {scenes.map((scene, index) => (
                <li key={scene.id} className="rounded-2xl bg-black p-4 text-sm">
                  <strong className="text-white">
                    {index + 1}. {scene.title}
                  </strong>
                  <span className="mt-1 block text-xs text-neutral-500">
                    {scene.visual} · {scene.duration}s
                  </span>
                </li>
              ))}
            </ol>
          ) : null}
        </section>
      </div>
    </>
  );
}
