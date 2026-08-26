import { describe, expect, it, vi } from "vitest";
import { productSchema, type Product } from "@/domain/ai/types";
import { analyzeProduct } from "./analyze-product";

const product: Product = {
  name: "Coffee",
  description: "Dark roast",
  category: "Drink",
  audience: "Coffee fans",
  sellingPoint: "Rich flavor",
  offer: "",
  cta: "Buy now",
  keyMessage: "Fresh coffee",
  concept: "Morning routine",
};

describe("analyzeProduct", () => {
  it("sends image payload to product analysis provider", async () => {
    const images = [{ mimeType: "image/png", base64: "AQ==" }];
    const generateStructured = vi.fn().mockResolvedValue({ value: product, raw: {} });

    await analyzeProduct({ images }, { textProvider: { generateStructured } });

    expect(generateStructured).toHaveBeenCalledWith({
      schema: productSchema,
      images,
      prompt: "Analyze these product and marketplace images for an Indonesian affiliate video. Return JSON with exactly: name, description, category, audience, sellingPoint, offer, cta, keyMessage, concept. Do not invent unverifiable claims.",
    });
  });
});
