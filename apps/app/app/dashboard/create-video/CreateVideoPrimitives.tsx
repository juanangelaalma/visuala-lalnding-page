import type { ReactNode } from "react";
import { panel, phaseStep } from "./create-video-constants";
import type { Phase } from "./create-video-types";
export function Icon({
  name,
  className = "h-5 w-5",
}: {
  name:
    | "arrow"
    | "check"
    | "chevron"
    | "image"
    | "pause"
    | "play"
    | "plus"
    | "sparkles"
    | "trash"
    | "upload"
    | "volume";
  className?: string;
}) {
  const paths: Record<typeof name, ReactNode> = {
    arrow: (
      <>
        <path d="m9 18 6-6-6-6" />
      </>
    ),
    check: (
      <>
        <path d="m5 12 4 4L19 6" />
      </>
    ),
    chevron: (
      <>
        <path d="m6 9 6 6 6-6" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="2" />
        <path d="m21 15-5-5L5 20" />
      </>
    ),
    pause: (
      <>
        <path d="M9 6v12M15 6v12" />
      </>
    ),
    play: (
      <>
        <path d="m8 5 11 7-11 7V5Z" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3L12 3ZM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15Zm14-2 .8 2.2 2.2.8-2.2.8L19 19l-.8-2.2L16 16l2.2-.8L19 13Z" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4m0 0L7 9m5-5 5 5M5 15v4h14v-4" />
      </>
    ),
    volume: (
      <>
        <path d="M5 10v4h3l4 4V6L8 10H5Zm11-1a4 4 0 0 1 0 6m2.5-8.5a8 8 0 0 1 0 11" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}
export function Header({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <header className="mb-8 max-w-3xl">
      <p className="mb-3 font-sans-secondary text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        {eyebrow}
      </p>
      <h1 className="font-display text-3xl font-bold uppercase leading-tight text-white sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl font-sans-secondary text-sm leading-6 text-neutral-450 sm:text-base">
        {copy}
      </p>
    </header>
  );
}
export function Stepper({ phase }: { phase: Phase }) {
  const current = phaseStep[phase];
  const labels = ["Upload", "Creator", "Scenes", "Generate"];
  return (
    <nav
      aria-label="Video creation progress"
      className={`${panel} mb-4 overflow-x-auto px-4 py-3 sm:px-6`}
    >
      <ol className="flex min-w-max items-center justify-center gap-2 sm:gap-4">
        {labels.map((label, index) => (
          <li key={label} className="flex items-center gap-2 sm:gap-4">
            <div
              aria-current={index === current ? "step" : undefined}
              className={`flex items-center gap-2 rounded-full px-2 py-1.5 font-sans-secondary text-xs font-semibold sm:px-3 ${index === current ? "bg-white/10 text-white" : index < current ? "text-primary" : "text-neutral-650"}`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border ${index <= current ? "border-primary bg-primary text-black" : "border-white/15"}`}
              >
                {index < current ? <Icon name="check" className="h-4 w-4" /> : index + 1}
              </span>
              <span>{label}</span>
            </div>
            {index < labels.length - 1 ? (
              <span
                className={`h-px w-5 sm:w-10 ${index < current ? "bg-primary" : "bg-white/10"}`}
              />
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
export function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-sans-secondary text-sm font-semibold text-white">
        {label}
      </span>
      {children}
      {help ? (
        <span className="mt-2 block font-sans-secondary text-xs leading-5 text-neutral-500">
          {help}
        </span>
      ) : null}
    </label>
  );
}
export function FooterActions({ children, meta }: { children: ReactNode; meta?: string }) {
  return (
    <footer className="sticky bottom-0 z-20 mt-8 flex flex-col gap-3 rounded-3xl border border-white/10 bg-black/95 p-4 shadow-2xl backdrop-blur sm:flex-row sm:items-center">
      <span className="font-sans-secondary text-xs text-neutral-450 sm:mr-auto">{meta}</span>
      <div className="flex flex-wrap justify-end gap-3 sm:ml-auto">{children}</div>
    </footer>
  );
}
