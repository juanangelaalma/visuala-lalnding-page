import type { GeminiTextProvider } from "@/domain/ai/providers";
import { productSchema, type Product } from "@/domain/ai/types";

const prompt = "Analyze these product and marketplace images for an Indonesian affiliate video. Return JSON with exactly: name, description, category, audience, sellingPoint, offer, cta, keyMessage, concept. Do not invent unverifiable claims.";

type ProductImage = { mimeType: string; base64: string };

export async function analyzeProduct(
  input: { images: ProductImage[] },
  deps: { textProvider: GeminiTextProvider },
): Promise<{ product: Product }> {
  const result = await deps.textProvider.generateStructured({ schema: productSchema, images: input.images, prompt });
  return { product: result.value };
}
