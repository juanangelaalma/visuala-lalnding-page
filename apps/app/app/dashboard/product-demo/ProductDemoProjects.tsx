"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ProductDemoProject = {
  id: string;
  name: string;
  duration: "short" | "standard" | "extended";
  aspectRatio: "landscape" | "portrait" | "square";
  motionStyle: string | null;
  status: string;
  updatedAt: string;
};

type ProjectsResponse = { projects: ProductDemoProject[] };

function projectLabel(project: ProductDemoProject) {
  return project.name || "Untitled product demo";
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export default function ProductDemoProjects() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProductDemoProject[]>([]);
  const [failed, setFailed] = useState(false);
  const [creating, setCreating] = useState(false);

  async function createProject() {
    setCreating(true);
    setFailed(false);
    try {
      const response = await fetch("/api/product-demo/projects", { method: "POST" });
      if (!response.ok) throw new Error("Project creation failed");
      const { project } = await response.json() as { project: { id: string } };
      router.push(`/dashboard/product-demo/${project.id}`);
    } catch {
      setFailed(true);
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    fetch("/api/product-demo/projects")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((response: ProjectsResponse) => setProjects(response.projects))
      .catch(() => setFailed(true));
  }, []);

  return (
    <section className="rounded-3xl border border-white/10 bg-pricing-bg p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Product Demo Studio</p>
          <h1 className="mt-3 font-display text-3xl font-bold uppercase text-white">Your product demos</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-450">Turn your SaaS product brief into a launch-ready video.</p>
        </div>
        <button type="button" onClick={createProject} disabled={creating} className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black transition hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50">{creating ? "Creating…" : "Create Product Demo"}</button>
      </div>

      {failed ? <p className="mt-8 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">Projects could not be loaded. Please try again.</p> : null}
      {!failed && projects.length === 0 ? <div className="mt-8 rounded-3xl border border-dashed border-white/15 bg-black/30 p-10 text-center"><h2 className="font-display text-xl uppercase text-white">No product demos yet</h2><p className="mt-3 text-sm text-neutral-450">Start with a product brief. Visuala builds the video plan.</p></div> : null}
      {projects.length ? <ul className="mt-8 grid gap-4 lg:grid-cols-2">{projects.map((project) => <li key={project.id}><Link href={`/dashboard/product-demo/${project.id}`} className="block rounded-3xl border border-white/10 bg-black/30 p-5 transition hover:border-primary/60 hover:bg-primary/[.04]"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{project.status.replaceAll("_", " ")}</p><h2 className="mt-3 text-lg font-semibold text-white">{projectLabel(project)}</h2><p className="mt-2 text-sm text-neutral-450">{project.duration} · {project.aspectRatio} · Updated {formatUpdatedAt(project.updatedAt)}</p></Link></li>)}</ul> : null}
    </section>
  );
}
