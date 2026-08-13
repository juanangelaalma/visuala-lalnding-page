This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

## AI worker configuration

AI routes are backend-only. Run `POST /api/ai/worker` from a trusted cron with
`Authorization: Bearer $AI_WORKER_SECRET`; never expose that secret to browser code.
Required production variables are `AI_WORKER_SECRET`, `GEMINI_API_KEY`, optional
`GEMINI_TEXT_MODEL`, `ATLASCLOUD_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and
`ATLAS_ASSET_HOSTS` (a comma-separated allowlist of Atlas output CDN hostnames).
`SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed to browser
code. AI assets are stored in the private Supabase Storage bucket `ai-assets`;
database records persist object paths, and API responses create signed HTTPS URLs
that expire after 15 minutes.

Upload product/reference images through authenticated `POST /api/ai/assets` and
pass the returned object paths as `referenceAssets` when creating a storyboard.

`ATLAS_VIDEO_MODELS_JSON` must be a JSON object keyed by
`video_i2v_economy`, `video_i2v_default`, `video_i2v_complex`,
`video_talking_head`, and `video_i2v_premium`. Each value has this shape:

```json
{"modelId":"verified/model-id","estimatedCostUsdPerSecond":0.05,"fields":{"prompt":"prompt","image":"image","duration":"duration","resolution":"resolution","aspectRatio":"aspect_ratio","audio":"generate_audio"},"capabilities":{"duration":true,"resolution":true,"aspectRatio":true,"audio":true}}
```

Use the provider's verified contract for each model; unsupported fields may be
omitted and their capability must be `false`. Local Remotion/FFmpeg composition
is intentionally only a zero-credit `waiting_for_composer` queue boundary.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
