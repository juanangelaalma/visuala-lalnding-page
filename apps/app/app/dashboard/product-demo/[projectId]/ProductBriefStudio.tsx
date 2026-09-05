"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveProductDemoSetupAction } from "@/features/product-demo/actions/product-demo-actions";

type ProductBriefStudioProps = {
  projectId: string;
};

const inputClassName = "mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-650 focus:border-primary focus:ring-2 focus:ring-primary/15";

export default function ProductBriefStudio({ projectId }: ProductBriefStudioProps) {
  const router = useRouter();
  const [brief, setBrief] = useState("");
  const [showOptional, setShowOptional] = useState(false);
  const [saving, setSaving] = useState(false);

  async function continueToBrandSetup() {
    setSaving(true);
    const result = await saveProductDemoSetupAction({ projectId, brief });
    setSaving(false);
    if (!result.error) router.push(`/dashboard/product-demo/${projectId}/brand`);
  }

  return <section className="mx-auto max-w-4xl"><nav aria-label="Product demo progress" className="mb-8 overflow-x-auto rounded-3xl border border-white/10 bg-pricing-bg px-5 py-4"><ol className="flex min-w-max items-center gap-3 text-xs font-semibold"><li className="flex items-center gap-2 text-white"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-black">1</span>Product brief</li><span className="h-px w-10 bg-white/10" /><li className="flex items-center gap-2 text-neutral-600"><span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15">2</span>Brand</li><span className="h-px w-10 bg-white/10" /><li className="flex items-center gap-2 text-neutral-600"><span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15">3</span>Video plan</li><span className="h-px w-10 bg-white/10" /><li className="flex items-center gap-2 text-neutral-600"><span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15">4</span>Storyboard</li></ol></nav>

    <div className="rounded-3xl border border-white/10 bg-pricing-bg p-6 sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Product Demo Studio</p>
      <h1 className="mt-3 font-display text-3xl font-bold uppercase leading-tight text-white sm:text-4xl">Tell us what you&apos;re launching.</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-450 sm:text-base">Describe the product or feature. Visuala will turn it into a clear product video plan.</p>

      <label className="mt-8 block"><span className="text-sm font-semibold text-white">What are you launching?</span><textarea value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="We built an AI meeting assistant that automatically summarizes meetings and extracts action items for remote teams." className={`${inputClassName} min-h-48 resize-y leading-6`} /><span className="mt-2 block text-xs text-neutral-500">A few sentences are enough. Include the problem, feature, and who it helps.</span></label>

      <div className="mt-8 border-t border-white/10 pt-6"><button type="button" onClick={() => setShowOptional(!showOptional)} aria-expanded={showOptional} className="flex w-full items-center justify-between text-left"><span><span className="block text-sm font-semibold text-white">Add details <span className="font-normal text-neutral-500">(optional)</span></span><span className="mt-1 block text-xs text-neutral-500">Help Visuala make the first video plan more precise.</span></span><span className="text-xl text-primary">{showOptional ? "−" : "+"}</span></button>{showOptional ? <div className="mt-6 grid gap-5 sm:grid-cols-2"><label><span className="text-sm font-medium text-white">Product name</span><input className={inputClassName} placeholder="Meetly" /></label><label><span className="text-sm font-medium text-white">Feature name</span><input className={inputClassName} placeholder="AI Meeting Summary" /></label><label><span className="text-sm font-medium text-white">Product URL</span><input type="url" className={inputClassName} placeholder="https://meetly.app" /></label><label><span className="text-sm font-medium text-white">Target audience</span><input className={inputClassName} placeholder="Remote product teams" /></label></div> : null}</div>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-neutral-500">Project {projectId.slice(0, 8)}</p><button type="button" onClick={continueToBrandSetup} disabled={!brief.trim() || saving} className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black transition hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40">{saving ? "Saving…" : "Continue to Brand Setup"}</button></div>
    </div>
  </section>;
}
