"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveProductDemoStoryboardAction } from "@/features/product-demo/actions/product-demo-storyboard-save-action";

type StoryboardStudioProps = {
  projectId: string;
  initialScenes: Scene[];
};

type Scene = {
  id: string;
  title: string;
  duration: number;
  headline: string;
  description: string;
  visual: string;
};

const initialScenes: Scene[] = [
  { id: "hook", title: "Hook", duration: 3, headline: "Meetings shouldn’t create more work.", description: "Open with the tension your audience knows too well.", visual: "Bold animated headline" },
  { id: "reveal", title: "Product Reveal", duration: 4, headline: "Meetly turns every meeting into structured insights.", description: "Introduce the product and its core promise.", visual: "Floating browser mockup" },
  { id: "feature", title: "Feature", duration: 5, headline: "Automatic meeting summaries.", description: "Show the feature transformation in context.", visual: "Transcript becomes an AI summary" },
  { id: "benefit", title: "Benefit", duration: 5, headline: "Key decisions and action items. Instantly.", description: "Make the user outcome concrete.", visual: "Action cards animate into focus" },
  { id: "cta", title: "CTA", duration: 4, headline: "Meet less. Get more done.", description: "Close with a concise product message.", visual: "Logo and primary CTA" },
];

export default function StoryboardStudio({ projectId, initialScenes: savedScenes }: StoryboardStudioProps) {
  const router = useRouter();
  const [scenes, setScenes] = useState(savedScenes.length ? savedScenes : initialScenes);
  const [expanded, setExpanded] = useState("hook");
  const [nextSceneId, setNextSceneId] = useState(1);
  const [saving, setSaving] = useState(false);

  function updateScene(id: string, field: "headline" | "description", value: string) {
    setScenes(scenes.map((scene) => scene.id === id ? { ...scene, [field]: value } : scene));
  }

  function moveScene(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= scenes.length) return;
    const next = [...scenes];
    [next[index], next[target]] = [next[target], next[index]];
    setScenes(next);
  }

  function duplicateScene(index: number) {
    const scene = scenes[index];
    setScenes([...scenes.slice(0, index + 1), { ...scene, id: `${scene.id}-${nextSceneId}`, title: `${scene.title} variation` }, ...scenes.slice(index + 1)]);
    setNextSceneId(nextSceneId + 1);
  }

  function deleteScene(id: string) {
    setScenes(scenes.filter((scene) => scene.id !== id));
  }

  async function generateVideo() {
    setSaving(true);
    const result = await saveProductDemoStoryboardAction({ projectId, scenes });
    setSaving(false);
    if (!result.error) router.push(`/dashboard/product-demo/${projectId}/generating`);
  }

  return <section className="mx-auto max-w-5xl"><nav aria-label="Product demo progress" className="mb-8 overflow-x-auto rounded-3xl border border-white/10 bg-pricing-bg px-5 py-4"><ol className="flex min-w-max items-center gap-3 text-xs font-semibold"><li className="flex items-center gap-2 text-primary"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-black">✓</span>Product brief</li><span className="h-px w-10 bg-primary" /><li className="flex items-center gap-2 text-primary"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-black">✓</span>Brand</li><span className="h-px w-10 bg-primary" /><li className="flex items-center gap-2 text-primary"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-black">✓</span>Video plan</li><span className="h-px w-10 bg-primary" /><li className="flex items-center gap-2 text-white"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-black">4</span>Storyboard</li></ol></nav>

    <div className="rounded-3xl border border-white/10 bg-pricing-bg p-6 sm:p-10"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">AI video plan</p><h1 className="mt-3 font-display text-3xl font-bold uppercase leading-tight text-white sm:text-4xl">Your storyboard is ready.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-450 sm:text-base">Review the scenes, fine-tune the message, then generate your product video. No timeline required.</p>

      <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/20 bg-primary/[.05] p-4"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-black">✓</span><p className="text-sm text-white"><strong>Feature Launch · Clean SaaS</strong><span className="text-neutral-450"> · {scenes.reduce((total, scene) => total + scene.duration, 0)} seconds · 16:9</span></p></div>

      <ol className="mt-6 space-y-3">{scenes.map((scene, index) => <li key={scene.id} className="overflow-hidden rounded-3xl border border-white/10 bg-black/30"><button type="button" onClick={() => setExpanded(expanded === scene.id ? "" : scene.id)} aria-expanded={expanded === scene.id} className="flex w-full items-center gap-4 p-4 text-left sm:p-5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-sm font-semibold text-primary">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-white">{scene.title}</span><span className="mt-1 block truncate text-xs text-neutral-450">{scene.headline}</span></span><span className="hidden text-xs font-semibold text-primary sm:block">{scene.duration} sec</span><span className="text-lg text-neutral-500">{expanded === scene.id ? "−" : "+"}</span></button>{expanded === scene.id ? <div className="border-t border-white/10 p-4 sm:p-5"><div className="grid gap-5 lg:grid-cols-[1fr_240px]"><div className="space-y-4"><label className="block"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-450">Headline</span><textarea value={scene.headline} onChange={(event) => updateScene(scene.id, "headline", event.target.value)} className="mt-2 min-h-20 w-full resize-y rounded-2xl border border-white/10 bg-pricing-bg px-4 py-3 text-sm leading-6 text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label><label className="block"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-450">Scene direction</span><textarea value={scene.description} onChange={(event) => updateScene(scene.id, "description", event.target.value)} className="mt-2 min-h-20 w-full resize-y rounded-2xl border border-white/10 bg-pricing-bg px-4 py-3 text-sm leading-6 text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label></div><div className="rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_50%_20%,#454817_0%,#1c1d0e_35%,#070707_80%)] p-4"><span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Visual direction</span><p className="mt-3 text-sm font-medium leading-6 text-white">{scene.visual}</p></div></div><div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4"><button type="button" onClick={() => duplicateScene(index)} className="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10">Duplicate</button><button type="button" onClick={() => moveScene(index, -1)} disabled={index === 0} className="rounded-full px-3 py-2 text-xs font-semibold text-neutral-450 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40">Move up</button><button type="button" onClick={() => moveScene(index, 1)} disabled={index === scenes.length - 1} className="rounded-full px-3 py-2 text-xs font-semibold text-neutral-450 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40">Move down</button><button type="button" onClick={() => deleteScene(scene.id)} disabled={scenes.length <= 1} className="ml-auto rounded-full px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-40">Delete</button></div></div> : null}</li>)}</ol>

      <button type="button" onClick={() => { setScenes([...scenes, { id: `scene-${nextSceneId}`, title: "New Scene", duration: 3, headline: "A new product moment.", description: "Describe what Visuala should communicate.", visual: "AI-selected product composition" }]); setNextSceneId(nextSceneId + 1); }} className="mt-4 flex w-full items-center justify-center rounded-3xl border border-dashed border-white/20 p-5 text-sm font-semibold text-neutral-450 transition hover:border-primary hover:text-primary">+ Add scene</button>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={() => router.push(`/dashboard/product-demo/${projectId}/video-plan`)} className="text-sm font-semibold text-neutral-450 transition hover:text-white">Back to Video Plan</button><button type="button" onClick={generateVideo} disabled={!scenes.length || saving} className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black transition hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40">{saving ? "Saving…" : "Generate Video"}</button></div>
    </div>
  </section>;
}
