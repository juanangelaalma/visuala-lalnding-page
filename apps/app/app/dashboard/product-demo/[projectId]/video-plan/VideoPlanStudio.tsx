"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { saveProductDemoSetupAction } from "@/features/product-demo/actions/product-demo-actions";
import { generateProductDemoStoryboardAction } from "@/features/product-demo/actions/product-demo-storyboard-actions";

type VideoPlanStudioProps = {
  projectId: string;
};

const goals = [
  { id: "product-launch", title: "Product Launch", description: "Introduce your product, key features, and why it matters.", flow: "Problem · Product · Features · Benefits · CTA" },
  { id: "feature-launch", title: "Feature Launch", description: "Announce one feature with a focused product story.", flow: "Hook · Problem · Reveal · How it works · CTA" },
  { id: "social-promo", title: "Social Promo", description: "Create a short, high-impact video for social channels.", flow: "Hook · Product · Benefit · CTA" },
  { id: "landing-page-demo", title: "Landing Page Demo", description: "Show your product UI and its core value quickly.", flow: "Product UI · Feature demo · Benefits" },
];

const durations = [
  { id: "short", title: "Short", detail: "10–15 sec", description: "A fast, focused message" },
  { id: "standard", title: "Standard", detail: "20–30 sec", description: "A complete launch story", recommended: true },
  { id: "extended", title: "Extended", detail: "30–45 sec", description: "More product detail" },
];

const ratios = [
  { id: "landscape", title: "Landscape", detail: "16:9", shape: "h-8 w-14" },
  { id: "portrait", title: "Portrait", detail: "9:16", shape: "h-12 w-7" },
  { id: "square", title: "Square", detail: "1:1", shape: "h-9 w-9" },
];

const styles = [
  { id: "clean-saas", title: "Clean SaaS", description: "Light, polished, product-led" },
  { id: "dark-premium", title: "Dark Premium", description: "Elegant, cinematic, subtle glow" },
  { id: "bold-launch", title: "Bold Launch", description: "Large type, fast, high contrast" },
  { id: "minimal", title: "Minimal", description: "Typography-led, spacious, calm" },
  { id: "startup-social", title: "Startup Social", description: "Captions, punchy, social-first" },
];

function OptionCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" onClick={onClick} aria-pressed={selected} className={`relative rounded-2xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${selected ? "border-primary bg-primary/[.08]" : "border-white/10 bg-black/30 hover:border-white/25"}`}>{selected ? <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-black">✓</span> : null}{children}</button>;
}

export default function VideoPlanStudio({ projectId }: VideoPlanStudioProps) {
  const router = useRouter();
  const [goal, setGoal] = useState("feature-launch");
  const [duration, setDuration] = useState("standard");
  const [ratio, setRatio] = useState("landscape");
  const [style, setStyle] = useState("clean-saas");
  const [saving, setSaving] = useState(false);

  async function generateVideoPlan() {
    setSaving(true);
    const result = await saveProductDemoSetupAction({
      projectId,
      goal: goal.replaceAll("-", "_"),
      duration,
      aspectRatio: ratio,
      motionStyle: style.replaceAll("-", "_"),
    });
    if (result.error) {
      setSaving(false);
      return;
    }
    const storyboard = await generateProductDemoStoryboardAction(projectId);
    setSaving(false);
    if (!storyboard.error) router.push(`/dashboard/product-demo/${projectId}/storyboard`);
  }

  return <section className="mx-auto max-w-5xl"><nav aria-label="Product demo progress" className="mb-8 overflow-x-auto rounded-3xl border border-white/10 bg-pricing-bg px-5 py-4"><ol className="flex min-w-max items-center gap-3 text-xs font-semibold"><li className="flex items-center gap-2 text-primary"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-black">✓</span>Product brief</li><span className="h-px w-10 bg-primary" /><li className="flex items-center gap-2 text-primary"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-black">✓</span>Brand</li><span className="h-px w-10 bg-primary" /><li className="flex items-center gap-2 text-white"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-black">3</span>Video plan</li><span className="h-px w-10 bg-white/10" /><li className="flex items-center gap-2 text-neutral-600"><span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15">4</span>Storyboard</li></ol></nav>

    <div className="rounded-3xl border border-white/10 bg-pricing-bg p-6 sm:p-10"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Step 3 · Video plan</p><h1 className="mt-3 font-display text-3xl font-bold uppercase leading-tight text-white sm:text-4xl">Choose the video direction.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-450 sm:text-base">Keep it simple. Choose the outcome, format, and creative energy. Visuala handles the storytelling.</p>

      <section className="mt-9"><h2 className="text-lg font-semibold text-white">What is this video for?</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{goals.map((item) => <OptionCard key={item.id} selected={goal === item.id} onClick={() => setGoal(item.id)}><h3 className="text-sm font-semibold text-white">{item.title}</h3><p className="mt-2 text-xs leading-5 text-neutral-450">{item.description}</p><p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">{item.flow}</p></OptionCard>)}</div></section>

      <div className="mt-9 grid gap-8 lg:grid-cols-2"><section><h2 className="text-lg font-semibold text-white">Duration</h2><div className="mt-4 grid gap-3">{durations.map((item) => <OptionCard key={item.id} selected={duration === item.id} onClick={() => setDuration(item.id)}><span className="flex items-center justify-between pr-6"><span><span className="block text-sm font-semibold text-white">{item.title}</span><span className="mt-1 block text-xs text-neutral-450">{item.description}</span></span><span className="text-sm font-semibold text-primary">{item.detail}</span></span>{item.recommended ? <span className="mt-3 inline-block rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">Recommended</span> : null}</OptionCard>)}</div></section>

        <section><h2 className="text-lg font-semibold text-white">Aspect ratio</h2><div className="mt-4 grid grid-cols-3 gap-3">{ratios.map((item) => <OptionCard key={item.id} selected={ratio === item.id} onClick={() => setRatio(item.id)}><span className="flex h-14 items-center justify-center"><span className={`rounded border-2 ${ratio === item.id ? "border-primary" : "border-white/50"} ${item.shape}`} /></span><span className="mt-3 block text-center text-sm font-semibold text-white">{item.title}</span><span className="mt-1 block text-center text-xs text-neutral-450">{item.detail}</span></OptionCard>)}</div></section></div>

      <section className="mt-9"><h2 className="text-lg font-semibold text-white">Motion style</h2><p className="mt-2 text-sm text-neutral-450">Your chosen direction guides scenes, transitions, typography, and pacing.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{styles.map((item) => <OptionCard key={item.id} selected={style === item.id} onClick={() => setStyle(item.id)}><span className="relative block aspect-video overflow-hidden rounded-xl"><Image src={`/product-demo-motion-styles/${item.id}.png`} alt={`${item.title} motion style preview`} fill sizes="(min-width: 1280px) 180px, (min-width: 640px) 40vw, 90vw" className="object-cover" /></span><span className="mt-3 block text-sm font-semibold text-white">{item.title}</span><span className="mt-1 block text-xs leading-5 text-neutral-450">{item.description}</span></OptionCard>)}</div></section>

      <div className="mt-9 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={() => router.push(`/dashboard/product-demo/${projectId}/brand`)} className="text-sm font-semibold text-neutral-450 transition hover:text-white">Back to Brand Setup</button><button type="button" onClick={generateVideoPlan} disabled={saving} className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black transition hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40">{saving ? "Saving…" : "Generate Video Plan"}</button></div>
    </div>
  </section>;
}
