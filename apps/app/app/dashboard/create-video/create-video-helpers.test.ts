import { describe, expect, it } from "vitest";
import { mapStudioSceneToAiScene, sortUploadedFiles } from "./create-video-helpers";

describe("create video helpers", () => {
  it("sorts main upload before other uploads", () => {
    const mainFile = new File(["main"], "main.png");
    const otherFile = new File(["other"], "other.png");

    expect(
      sortUploadedFiles([
        { main: false, file: otherFile },
        { main: true, file: mainFile },
      ]),
    ).toEqual([mainFile, otherFile]);
  });

  it("maps studio scene into video request scene", () => {
    expect(
      mapStudioSceneToAiScene(
        {
          id: "scene-1",
          title: "Hook",
          duration: 4,
          visual: "Creator holds product",
          dialogue: "Try this",
          sceneType: "talking_to_camera",
          motionComplexity: "medium",
          videoPrompt: "Natural movement",
          negativePrompt: "text",
        },
        2,
      ),
    ).toEqual({
      id: "scene-1",
      position: 2,
      title: "Hook",
      sceneType: "talking_to_camera",
      motionComplexity: "medium",
      imagePrompt: "Creator holds product",
      videoPrompt: "Natural movement",
      negativePrompt: "text",
      dialogue: "Try this",
      durationSeconds: 4,
      approvedImageGenerationId: null,
    });
  });
});
