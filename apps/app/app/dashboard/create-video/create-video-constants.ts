import type { Product, Phase } from "./create-video-types";

export const emptyProduct: Product = {
  name: "",
  description: "",
  category: "",
  audience: "",
  sellingPoint: "",
  offer: "",
  cta: "",
  keyMessage: "",
  concept: "",
};

export const creators = [
  {
    id: "nadia",
    name: "Nadia",
    persona: "Friendly beauty creator",
    style: "Warm, natural, conversational",
    initials: "NA",
  },
  {
    id: "alya",
    name: "Alya",
    persona: "Energetic lifestyle creator",
    style: "Upbeat, expressive, persuasive",
    initials: "AL",
  },
  {
    id: "sarah",
    name: "Sarah",
    persona: "Calm product reviewer",
    style: "Soft, trustworthy, informative",
    initials: "SA",
  },
  {
    id: "raka",
    name: "Raka",
    persona: "Casual everyday creator",
    style: "Relaxed, confident, direct",
    initials: "RA",
  },
];

export const durations = [
  {
    seconds: 12,
    label: "Quick",
    detail: "A sharp hook and simple introduction",
    scenes: "Around 3 scenes",
    credits: 1,
  },
  {
    seconds: 18,
    label: "Standard",
    detail: "A complete problem–solution story",
    scenes: "Around 5 scenes",
    credits: 1,
    recommended: true,
  },
  {
    seconds: 25,
    label: "Extended",
    detail: "A detailed demonstration or review",
    scenes: "Around 6–7 scenes",
    credits: 2,
  },
];

export const phaseStep: Record<Phase, number> = {
  product: 0,
  analyzing: 0,
  review: 0,
  talent: 1,
  "scene-loading": 2,
  scenes: 2,
  rendering: 3,
  result: 4,
};
export const panel = "rounded-3xl border border-white/10 bg-pricing-bg";
export const input =
  "w-full rounded-2xl border border-white/10 bg-black px-4 py-3 font-sans-secondary text-sm text-white outline-none transition placeholder:text-neutral-650 focus:border-primary/70 focus:ring-2 focus:ring-primary/10";
