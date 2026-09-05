"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type GeneratingVideoProps = {
  projectId: string;
};

const tasks = ["Preparing scene compositions", "Rendering product UI", "Applying motion and transitions", "Composing final video"];

export default function GeneratingVideo({ projectId }: GeneratingVideoProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(5);

  useEffect(() => {
    const timer = window.setInterval(() => setProgress((value) => Math.min(100, value + 4)), 260);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress < 100) return;
    const timer = window.setTimeout(() => router.replace(`/dashboard/product-demo/${projectId}/preview`), 700);
    return () => window.clearTimeout(timer);
  }, [progress, projectId, router]);

  const activeTask = Math.min(tasks.length - 1, Math.floor(progress / 25));

  return <section className="flex min-h-[680px] items-center justify-center rounded-3xl border border-white/10 bg-pricing-bg p-6"><div className="w-full max-w-2xl text-center"><div className="relative mx-auto flex h-20 w-20 items-center justify-center"><span className="absolute inset-0 animate-ping rounded-3xl bg-primary/20" /><span className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-2xl text-black">✦</span></div><p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Visuala generation engine</p><h1 className="mt-3 font-display text-3xl font-bold uppercase text-white sm:text-4xl">Generating your product demo.</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-neutral-450">Visuala is building every scene, applying the motion direction, and composing your launch-ready video.</p><div className="mt-10"><div className="flex items-end justify-between"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Rendering video</span><strong className="font-display text-3xl text-white">{progress}%</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} /></div></div><div className="mt-8 rounded-3xl border border-white/10 bg-black/30 p-5 text-left">{tasks.map((task, index) => <div key={task} className="flex items-center gap-3 border-b border-white/[.07] py-4 last:border-0"><span className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${index < activeTask ? "border-primary bg-primary text-black" : index === activeTask ? "animate-pulse border-primary text-primary" : "border-white/15 text-neutral-600"}`}>{index < activeTask ? "✓" : index + 1}</span><span className={`text-sm ${index <= activeTask ? "text-white" : "text-neutral-600"}`}>{task}</span>{index === activeTask && progress < 100 ? <span className="ml-auto text-xs font-semibold text-primary">Working</span> : null}</div>)}</div><button type="button" onClick={() => router.push(`/dashboard/product-demo/${projectId}/preview`)} className="mt-7 text-sm font-semibold text-neutral-450 transition hover:text-white">Skip generation preview</button></div></section>;
}
