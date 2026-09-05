"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ProductDemoExportProps = {
  projectId: string;
};

const resolutions = [
  { id: "720p", title: "720p", description: "Fast preview export" },
  { id: "1080p", title: "1080p", description: "Launch-ready quality", recommended: true },
];

const formats = [
  { id: "mp4", title: "MP4", description: "Best for most platforms" },
  { id: "webm", title: "WebM", description: "Optimized for the web" },
];

const ratios = [
  { id: "16:9", title: "Landscape", detail: "16:9", shape: "h-9 w-16" },
  { id: "9:16", title: "Portrait", detail: "9:16", shape: "h-14 w-8" },
  { id: "1:1", title: "Square", detail: "1:1", shape: "h-10 w-10" },
];

export default function ProductDemoExport({ projectId }: ProductDemoExportProps) {
  const router = useRouter();
  const [resolution, setResolution] = useState("1080p");
  const [format, setFormat] = useState("mp4");
  const [ratio, setRatio] = useState("16:9");
  const [rendering, setRendering] = useState(false);
  const [rendered, setRendered] = useState(false);

  function exportVideo() {
    setRendering(true);
    window.setTimeout(() => {
      setRendering(false);
      setRendered(true);
    }, 900);
  }

  return <section className="mx-auto max-w-5xl"><div className="rounded-3xl border border-white/10 bg-pricing-bg p-6 sm:p-10"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Export video</p><h1 className="mt-3 font-display text-3xl font-bold uppercase leading-tight text-white sm:text-4xl">Your product demo is ready.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-450 sm:text-base">Choose the final format. Visuala will render your selected layout rather than crop the video.</p>

    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]"><div className="space-y-7"><section><h2 className="text-lg font-semibold text-white">Resolution</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{resolutions.map((item) => <button key={item.id} type="button" onClick={() => setResolution(item.id)} aria-pressed={resolution === item.id} className={`rounded-2xl border p-4 text-left transition ${resolution === item.id ? "border-primary bg-primary/[.08]" : "border-white/10 bg-black/30 hover:border-white/25"}`}><span className="flex items-center justify-between"><span className="text-sm font-semibold text-white">{item.title}</span>{item.recommended ? <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">Recommended</span> : null}</span><span className="mt-2 block text-xs text-neutral-450">{item.description}</span></button>)}</div></section>

      <section><h2 className="text-lg font-semibold text-white">Format</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{formats.map((item) => <button key={item.id} type="button" onClick={() => setFormat(item.id)} aria-pressed={format === item.id} className={`rounded-2xl border p-4 text-left transition ${format === item.id ? "border-primary bg-primary/[.08]" : "border-white/10 bg-black/30 hover:border-white/25"}`}><span className="text-sm font-semibold text-white">{item.title}</span><span className="mt-2 block text-xs text-neutral-450">{item.description}</span></button>)}</div></section>

      <section><h2 className="text-lg font-semibold text-white">Aspect ratio</h2><p className="mt-2 text-sm text-neutral-450">Generate another platform-ready layout from this project.</p><div className="mt-4 grid grid-cols-3 gap-3">{ratios.map((item) => <button key={item.id} type="button" onClick={() => setRatio(item.id)} aria-pressed={ratio === item.id} className={`rounded-2xl border p-4 text-center transition ${ratio === item.id ? "border-primary bg-primary/[.08]" : "border-white/10 bg-black/30 hover:border-white/25"}`}><span className="flex h-16 items-center justify-center"><span className={`rounded border-2 ${ratio === item.id ? "border-primary" : "border-white/50"} ${item.shape}`} /></span><span className="mt-3 block text-sm font-semibold text-white">{item.title}</span><span className="mt-1 block text-xs text-neutral-450">{item.detail}</span></button>)}</div></section></div>

      <aside className="h-fit rounded-3xl border border-white/10 bg-black/30 p-5"><div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_50%_20%,#51551c_0%,#1b1d0b_35%,#050505_75%)] ${ratio === "9:16" ? "mx-auto aspect-[9/16] max-w-40" : ratio === "1:1" ? "mx-auto aspect-square max-w-56" : "aspect-video"}`}><div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center"><span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Meetly</span><strong className="mt-3 font-display text-lg uppercase leading-tight text-white">Meet less.<br />Get more done.</strong></div></div><h2 className="mt-5 text-sm font-semibold text-white">Export summary</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-neutral-500">Resolution</dt><dd className="font-medium text-white">{resolution}</dd></div><div className="flex justify-between gap-3"><dt className="text-neutral-500">Format</dt><dd className="font-medium uppercase text-white">{format}</dd></div><div className="flex justify-between gap-3"><dt className="text-neutral-500">Aspect ratio</dt><dd className="font-medium text-white">{ratio}</dd></div><div className="flex justify-between gap-3"><dt className="text-neutral-500">Duration</dt><dd className="font-medium text-white">21 sec</dd></div></dl></aside></div>

    {rendered ? <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/[.08] p-5"><p className="text-sm font-semibold text-primary">Export ready</p><p className="mt-1 text-sm text-white">Your {resolution} {format.toUpperCase()} product demo is ready to download.</p><button type="button" className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-primary-dark">Download video</button></div> : null}
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={() => router.push(`/dashboard/product-demo/${projectId}/preview`)} className="text-sm font-semibold text-neutral-450 transition hover:text-white">Back to Preview</button><button type="button" onClick={exportVideo} disabled={rendering} className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black transition hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40">{rendering ? "Rendering video…" : "Export Video"}</button></div>
  </div></section>;
}
