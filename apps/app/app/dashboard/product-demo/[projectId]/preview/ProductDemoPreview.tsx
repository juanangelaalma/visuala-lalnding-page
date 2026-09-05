"use client";

import { useRouter } from "next/navigation";

type ProductDemoPreviewProps = {
  projectId: string;
};

export default function ProductDemoPreview({ projectId }: ProductDemoPreviewProps) {
  const router = useRouter();

  return <section className="mx-auto max-w-5xl"><div className="rounded-3xl border border-white/10 bg-pricing-bg p-6 sm:p-10"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Video preview</p><h1 className="mt-3 font-display text-3xl font-bold uppercase leading-tight text-white sm:text-4xl">Your product demo is ready.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-450 sm:text-base">Review the generated video. Need changes? Return to your storyboard, refine the scenes, then generate again.</p><div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-black"><div className="relative aspect-video bg-[radial-gradient(circle_at_50%_20%,#51551c_0%,#1b1d0b_35%,#050505_75%)]"><div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgb(255_255_255_/_0.04)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255_/_0.04)_1px,transparent_1px)] [background-size:32px_32px]" /><div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"><span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Meetly</span><strong className="mt-5 max-w-xl font-display text-3xl uppercase leading-tight text-white sm:text-5xl">Meet less.<br />Get more done.</strong><p className="mt-4 text-sm text-white/60">21-second Feature Launch · Clean SaaS</p></div><button type="button" aria-label="Play preview" className="absolute bottom-6 left-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg text-black shadow-lg transition hover:scale-105">▶</button></div></div><div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={() => router.push(`/dashboard/product-demo/${projectId}/storyboard`)} className="text-sm font-semibold text-neutral-450 transition hover:text-white">Back to Storyboard</button><button type="button" onClick={() => router.push(`/dashboard/product-demo/${projectId}/export`)} className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black transition hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Export Video</button></div></div></section>;
}
