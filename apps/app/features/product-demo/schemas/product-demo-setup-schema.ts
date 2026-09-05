import { z } from "zod";

const emptyToNull = z.string().trim().transform((value) => value || null);

export const productDemoSetupSchema = z.object({
  projectId: z.string().uuid(),
  brief: z.string().trim().min(1, "Describe what you are launching.").optional(),
  name: emptyToNull.optional(),
  productUrl: z.union([z.literal(""), z.string().url("Enter a valid product URL.")]).transform((value) => value || null).optional(),
  featureName: emptyToNull.optional(),
  targetAudience: emptyToNull.optional(),
  brand: z.object({
    logoName: z.string().trim().min(1, "Upload a logo first."),
    colors: z.array(z.object({ name: z.string(), value: z.string().regex(/^#[0-9A-Fa-f]{6}$/) })).length(4),
    fontStyle: z.enum(["Modern", "Professional", "Friendly", "Technical", "Elegant"]),
  }).optional(),
  goal: z.enum(["product_launch", "feature_launch", "social_promo", "landing_page_demo"]).optional(),
  duration: z.enum(["short", "standard", "extended"]).optional(),
  aspectRatio: z.enum(["landscape", "portrait", "square"]).optional(),
  motionStyle: z.enum(["clean_saas", "dark_premium", "bold_launch", "minimal", "startup_social"]).optional(),
});

export type ProductDemoSetupInput = z.infer<typeof productDemoSetupSchema>;
