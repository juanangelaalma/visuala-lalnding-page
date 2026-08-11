import { describe, expect, it } from "vitest";
import { normalizeSceneDurations, storyboardSceneSchema } from "./types";

const scene = storyboardSceneSchema.parse({
  title: "x",
  sceneType: "benefit",
  motionComplexity: "low",
  imagePrompt: "x",
  videoPrompt: "x",
  dialogue: "",
  duration: 4,
});

describe("scene duration normalization", () => {
  it("produces the exact requested total", () => {
    expect(normalizeSceneDurations([scene, scene, scene, scene], 18).reduce((sum, item) => sum + item.duration, 0)).toBe(18);
  });

  it("preserves an exact storyboard", () => {
    expect(normalizeSceneDurations([{ ...scene, duration: 6 }], 6)[0].duration).toBe(6);
  });
});
