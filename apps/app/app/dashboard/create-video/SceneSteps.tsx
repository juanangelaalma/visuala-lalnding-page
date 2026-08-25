import { Button } from "@visuala/ui";
import { useState, type ReactNode } from "react";
import { input, panel } from "./create-video-constants";
import type { Product, Scene } from "./create-video-types";
import { Field, FooterActions, Header, Icon } from "./CreateVideoPrimitives";

export function LoadingView({
  kind,
  progress,
  scenes,
}: {
  kind: "scenes" | "video";
  progress: number;
  scenes: Scene[];
}) {
  const sceneTasks = [
    "Analyzing product",
    "Preparing concept",
    "Writing dialogue",
    "Building visual directions",
    "Finalizing scenes",
  ];
  const activeIndex = Math.min(sceneTasks.length - 1, Math.floor(progress / 20));
  return (
    <div className="flex min-h-[620px] items-center justify-center">
      <section className="w-full max-w-2xl text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-black">
          <Icon name="sparkles" className="h-7 w-7" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-bold uppercase text-white">
          {kind === "scenes" ? "Creating your scenes" : "Generating your video"}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-neutral-450">
          {kind === "scenes"
            ? "Visuala is preparing a natural creator-led concept from your product details."
            : "Each scene is being rendered by the configured AI providers."}
        </p>
        <div className="mt-8">
          <div className="mb-3 flex items-end justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              AI generation
            </span>
            <strong className="font-display text-2xl text-white">{progress}%</strong>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className={`${panel} mt-6 p-5 text-left`}>
          {kind === "scenes"
            ? sceneTasks.map((task, index) => (
                <div
                  key={task}
                  className="flex items-center gap-3 border-b border-white/[.06] py-3 last:border-0"
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border ${index < activeIndex ? "border-primary bg-primary text-black" : index === activeIndex ? "animate-pulse border-primary text-primary" : "border-white/15 text-neutral-650"}`}
                  >
                    {index < activeIndex ? (
                      <Icon name="check" className="h-3.5 w-3.5" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span
                    className={`text-sm ${index <= activeIndex ? "text-white" : "text-neutral-650"}`}
                  >
                    {task}
                  </span>
                </div>
              ))
            : scenes.map((scene, index) => {
                const threshold = ((index + 1) / (scenes.length + 1)) * 100;
                const done = progress > threshold;
                const active = !done && progress > threshold - 22;
                return (
                  <div
                    key={scene.id}
                    className="flex items-center gap-3 border-b border-white/[.06] py-3 last:border-0"
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${done ? "bg-primary" : active ? "animate-pulse bg-primary" : "bg-white/15"}`}
                    />
                    <span
                      className={`min-w-0 flex-1 truncate text-sm ${active ? "font-semibold text-white" : "text-neutral-450"}`}
                    >
                      Scene {index + 1} · {scene.title}
                    </span>
                    <span className="text-xs text-neutral-650">
                      {done ? "Complete" : active ? "Rendering" : "Waiting"}
                    </span>
                  </div>
                );
              })}
        </div>
      </section>
    </div>
  );
}
function SceneCard({
  scene,
  index,
  expanded,
  onToggle,
  onChange,
  onRegenerate,
}: {
  scene: Scene;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (scene: Scene) => void;
  onRegenerate: () => void;
}) {
  const speech = Math.max(1, Math.round((scene.dialogue.split(/\s+/).length / 2.7) * 10) / 10);
  return (
    <article className={`${panel} overflow-hidden`}>
      <button
        type="button"
        className="flex w-full items-center gap-3 p-4 text-left sm:p-5"
        onClick={onToggle}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-sm font-semibold text-primary">
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block truncate font-display text-sm font-semibold uppercase text-white sm:text-base">
            {scene.title}
          </strong>
          <span className="mt-1 block text-xs text-neutral-500">{scene.duration} seconds</span>
        </span>
        <Icon
          name="chevron"
          className={`h-5 w-5 text-neutral-500 transition ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded ? (
        <div className="border-t border-white/[.07] p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Visual direction">
              <textarea
                className={`${input} min-h-28 resize-y`}
                value={scene.visual}
                onChange={(e) => onChange({ ...scene, visual: e.target.value })}
              />
            </Field>
            <Field label="Dialogue / voice over">
              <textarea
                className={`${input} min-h-28 resize-y`}
                value={scene.dialogue}
                onChange={(e) => onChange({ ...scene, dialogue: e.target.value })}
              />
              <span
                className={`mt-2 block text-xs ${speech > scene.duration ? "text-amber-300" : "text-neutral-500"}`}
              >
                Estimated speech: {speech}s
                {speech > scene.duration ? " · Shorten this dialogue to fit" : ""}
              </span>
            </Field>
          </div>
          <div className="mt-5 border-t border-white/[.07] pt-4">
            <Button size="sm" variant="outline" tone="light" onClick={onRegenerate}>
              Regenerate draft
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
function Modal({
  title,
  copy,
  children,
  actions,
  onClose,
}: {
  title: string;
  copy: string;
  children?: ReactNode;
  actions: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-pricing-bg p-6 shadow-2xl"
      >
        <h2 id="modal-title" className="font-display text-2xl font-bold uppercase text-white">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-neutral-450">{copy}</p>
        {children}
        <div className="mt-6 flex justify-end gap-3">{actions}</div>
      </section>
    </div>
  );
}
export function SceneEditor({
  scenes,
  setScenes,
  product,
  creatorName,
  duration,
  onBack,
  onRender,
}: {
  scenes: Scene[];
  setScenes: (scenes: Scene[]) => void;
  product: Product;
  creatorName: string;
  duration: number;
  onBack: () => void;
  onRender: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(scenes[0]?.id ?? null);
  const [regenId, setRegenId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [instruction, setInstruction] = useState("");
  const update = (scene: Scene) =>
    setScenes(scenes.map((item) => (item.id === scene.id ? scene : item)));
  const regenerate = () => {
    if (!regenId) return;
    setRegenerating(true);
    window.setTimeout(() => {
      setScenes(
        scenes.map((scene) =>
          scene.id === regenId
            ? {
                ...scene,
                visual: `${scene.visual.replace(/\.$/, "")} with more natural handheld movement.`,
                dialogue:
                  instruction.trim() ||
                  "Here’s why this has become the gentle cleanser I reach for every day.",
              }
            : scene,
        ),
      );
      setRegenerating(false);
      setRegenId(null);
      setInstruction("");
    }, 1100);
  };
  return (
    <>
      <Header
        eyebrow="Step 3 · Scene editor"
        title="Shape the story before rendering"
        copy="Edit the generated visual directions and dialogue. Changes are saved to the project when rendering starts."
      />
      <div className={`${panel} mb-5 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5`}>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-black">
          <Icon name="image" />
        </div>
        <div className="min-w-0 flex-1">
          <strong className="block truncate text-sm text-white">{product.name}</strong>
          <span className="text-xs text-neutral-500">
            {creatorName} · {duration}s · {scenes.length} scenes · 9:16
          </span>
        </div>
        <Button variant="outline" tone="light" size="sm" onClick={onBack}>
          Change settings
        </Button>
      </div>
      <div className="grid gap-3">
        {scenes.map((scene, index) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            index={index}
            expanded={expanded === scene.id}
            onToggle={() => setExpanded(expanded === scene.id ? null : scene.id)}
            onChange={update}
            onRegenerate={() => setRegenId(scene.id)}
          />
        ))}
      </div>
      <FooterActions
        meta={`${scenes.length} scenes · ${scenes.reduce((total, scene) => total + scene.duration, 0)} seconds · ${creatorName} voice`}
      >
        <Button variant="outline" tone="light" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onRender} disabled={!scenes.length}>
          Generate video <Icon name="sparkles" />
        </Button>
      </FooterActions>
      {regenId ? (
        <Modal
          title="Regenerate scene draft"
          copy="Adjust this scene before its image and video are generated."
          onClose={() => !regenerating && setRegenId(null)}
          actions={
            <>
              <Button
                variant="outline"
                tone="light"
                onClick={() => setRegenId(null)}
                disabled={regenerating}
              >
                Cancel
              </Button>
              <Button onClick={regenerate} disabled={regenerating}>
                {regenerating ? "Regenerating…" : "Regenerate draft"}
              </Button>
            </>
          }
        >
          <Field label="What should improve? (optional)">
            <textarea
              autoFocus
              className={`${input} mt-5 min-h-24`}
              placeholder="Make it more casual and less promotional…"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
            />
          </Field>
        </Modal>
      ) : null}
    </>
  );
}
