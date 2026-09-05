"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveProductDemoSetupAction } from "@/features/product-demo/actions/product-demo-actions";

type BrandSetupStudioProps = {
  projectId: string;
};

const palette = [
  { name: "Primary", value: "#7C3AED" },
  { name: "Secondary", value: "#A855F7" },
  { name: "Neutral", value: "#111827" },
  { name: "Background", value: "#FFFFFF" },
];

const typographyStyles = [
  { name: "Modern", description: "Clean, confident, versatile", headlineClassName: "font-display uppercase tracking-tight", bodyClassName: "font-sans" },
  { name: "Professional", description: "Clear, polished, dependable", headlineClassName: "font-sans font-bold tracking-tight", bodyClassName: "font-sans-secondary" },
  { name: "Friendly", description: "Warm, direct, approachable", headlineClassName: "font-sans font-bold tracking-normal", bodyClassName: "font-sans" },
  { name: "Technical", description: "Precise, structured, product-led", headlineClassName: "font-mono text-[15px] font-medium tracking-tight", bodyClassName: "font-mono text-[11px]" },
  { name: "Elegant", description: "Refined, editorial, premium", headlineClassName: "font-serif font-semibold tracking-tight", bodyClassName: "font-serif text-[13px]" },
];

export default function BrandSetupStudio({ projectId }: BrandSetupStudioProps) {
  const router = useRouter();
  const [logoName, setLogoName] = useState("");
  const [colors, setColors] = useState(palette);
  const [fontStyle, setFontStyle] = useState("Modern");
  const [isGeneratingPalette, setIsGeneratingPalette] = useState(false);
  const [paletteGenerated, setPaletteGenerated] = useState(false);
  const [saving, setSaving] = useState(false);

  function updateColor(index: number, value: string) {
    setColors(colors.map((color, colorIndex) => colorIndex === index ? { ...color, value } : color));
  }

  function generatePaletteSuggestion() {
    setIsGeneratingPalette(true);
    window.setTimeout(() => {
      setColors(palette);
      setPaletteGenerated(true);
      setIsGeneratingPalette(false);
    }, 650);
  }

  async function continueToVideoPlan() {
    setSaving(true);
    const result = await saveProductDemoSetupAction({ projectId, brand: { logoName, colors, fontStyle } });
    setSaving(false);
    if (!result.error) router.push(`/dashboard/product-demo/${projectId}/video-plan`);
  }

  return <section className="mx-auto max-w-4xl"><nav aria-label="Product demo progress" className="mb-8 overflow-x-auto rounded-3xl border border-white/10 bg-pricing-bg px-5 py-4"><ol className="flex min-w-max items-center gap-3 text-xs font-semibold"><li className="flex items-center gap-2 text-primary"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-black">✓</span>Product brief</li><span className="h-px w-10 bg-primary" /><li className="flex items-center gap-2 text-white"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-black">2</span>Brand</li><span className="h-px w-10 bg-white/10" /><li className="flex items-center gap-2 text-neutral-600"><span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15">3</span>Video plan</li><span className="h-px w-10 bg-white/10" /><li className="flex items-center gap-2 text-neutral-600"><span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15">4</span>Storyboard</li></ol></nav>

    <div className="rounded-3xl border border-white/10 bg-pricing-bg p-6 sm:p-10"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Step 2 · Brand setup</p><h1 className="mt-3 font-display text-3xl font-bold uppercase leading-tight text-white sm:text-4xl">Make it look like your product.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-450 sm:text-base">Upload a logo. Visuala extracts a starting palette you can refine before generating your video plan.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]"><section className="rounded-3xl border border-white/10 bg-black/30 p-5"><h2 className="text-sm font-semibold text-white">Logo</h2><label className="mt-4 flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-white/20 bg-black/40 px-6 text-center transition hover:border-primary hover:bg-primary/[.03]"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl text-primary">↑</span><span className="mt-4 text-sm font-semibold text-white">{logoName || "Upload your logo"}</span><span className="mt-1 text-xs text-neutral-500">PNG, JPG, SVG, or WEBP</span><input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="sr-only" onChange={(event) => setLogoName(event.target.files?.[0]?.name ?? "")} /></label><p className="mt-4 text-xs leading-5 text-neutral-500">Required. A clear logo helps keep the final CTA and visual direction on-brand.</p><button type="button" onClick={generatePaletteSuggestion} disabled={!logoName || isGeneratingPalette} className="mt-5 inline-flex w-full items-center justify-center rounded-full border border-primary/50 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40">{isGeneratingPalette ? "Generating suggestion…" : "Generate AI Suggestion"}</button></section>

        <section className="rounded-3xl border border-white/10 bg-black/30 p-5"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-white">Color palette</h2><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{paletteGenerated ? "AI suggested" : "Awaiting logo"}</span></div><p className="mt-2 text-xs leading-5 text-neutral-500">Edit any color. These guide backgrounds, accents, and product UI.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{colors.map((color, index) => <label key={color.name} className="rounded-2xl border border-white/10 bg-pricing-bg p-3"><span className="text-xs font-medium text-neutral-450">{color.name}</span><span className="mt-2 flex items-center gap-3"><input aria-label={`${color.name} color`} type="color" value={color.value} onChange={(event) => updateColor(index, event.target.value)} className="h-9 w-9 cursor-pointer rounded-lg border-0 bg-transparent p-0" /><input value={color.value} onChange={(event) => updateColor(index, event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-medium text-white outline-none" /></span></label>)}</div></section></div>

      <section className="mt-6 rounded-3xl border border-white/10 bg-black/30 p-5"><div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between"><h2 className="text-sm font-semibold text-white">Typography direction <span className="font-normal text-neutral-500">(optional)</span></h2><p className="text-xs text-neutral-500">Preview how your video copy will feel.</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{typographyStyles.map((style) => <button key={style.name} type="button" onClick={() => setFontStyle(style.name)} aria-pressed={fontStyle === style.name} className={`min-h-36 rounded-2xl border p-4 text-left transition ${fontStyle === style.name ? "border-primary bg-primary/[.08] text-white" : "border-white/10 bg-pricing-bg text-neutral-450 hover:border-white/25"}`}><span className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{style.name}</span>{fontStyle === style.name ? <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-black">✓</span> : null}</span><span className={`mt-5 block text-xl leading-none text-white ${style.headlineClassName}`}>Ship faster.</span><span className={`mt-2 block text-xs text-neutral-450 ${style.bodyClassName}`}>Your launch video, ready to share.</span><span className="mt-4 block text-xs text-neutral-500">{style.description}</span></button>)}</div></section>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={() => router.push(`/dashboard/product-demo/${projectId}`)} className="text-sm font-semibold text-neutral-450 transition hover:text-white">Back to Product Brief</button><button type="button" onClick={continueToVideoPlan} disabled={!logoName || saving} className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black transition hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40">{saving ? "Saving…" : "Continue to Video Plan"}</button></div>
    </div>
  </section>;
}
