import "server-only";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Readable, Transform } from "node:stream";
import { z } from "zod";

const schema = z.object({
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET: z.string().min(1),
  R2_PUBLIC_BASE_URL: z.string().url(),
  ATLAS_ASSET_HOSTS: z.string().min(1),
});
const allowed = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/webm", "audio/mpeg", "audio/wav"]);
const MAX_BYTES = 100 * 1024 * 1024;

function config() {
  const parsed = schema.parse({
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: process.env.R2_BUCKET,
    R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
    ATLAS_ASSET_HOSTS: process.env.ATLAS_ASSET_HOSTS,
  });
  return { ...parsed, atlasAssetHosts: new Set(parsed.ATLAS_ASSET_HOSTS.split(",").map((host) => host.trim().toLowerCase()).filter(Boolean)) };
}

function client(c: ReturnType<typeof config>) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${c.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: c.R2_ACCESS_KEY_ID, secretAccessKey: c.R2_SECRET_ACCESS_KEY },
  });
}

function publicUrl(c: ReturnType<typeof config>, key: string) {
  return `${c.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
}

export async function uploadAsset(body: Uint8Array, contentType: string, key: string) {
  const c = config();
  if (!allowed.has(contentType) || body.byteLength > MAX_BYTES) throw new Error("Asset rejected");
  await client(c).send(new PutObjectCommand({ Bucket: c.R2_BUCKET, Key: key, Body: body, ContentType: contentType, ContentLength: body.byteLength }));
  return publicUrl(c, key);
}

export async function copyRemoteAsset(url: string, key: string) {
  const c = config();
  const source = new URL(url);
  if (source.protocol !== "https:" || !c.atlasAssetHosts.has(source.hostname.toLowerCase())) {
    throw new Error("Provider asset host rejected");
  }

  const response = await fetch(source, { signal: AbortSignal.timeout(30_000), redirect: "manual" });
  if (response.status >= 300 && response.status < 400) throw new Error("Provider asset redirect rejected");
  if (!response.ok || !response.body) throw new Error(`Could not copy provider asset (${response.status})`);
  const type = response.headers.get("content-type")?.split(";")[0] ?? "";
  const length = Number(response.headers.get("content-length") ?? 0);
  if (!allowed.has(type) || length > MAX_BYTES) throw new Error("Provider asset rejected");

  let received = 0;
  const limiter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      received += chunk.byteLength;
      callback(received > MAX_BYTES ? new Error("Provider asset is too large") : null, chunk);
    },
  });
  const body = Readable.fromWeb(response.body as import("node:stream/web").ReadableStream).pipe(limiter);
  await client(c).send(new PutObjectCommand({ Bucket: c.R2_BUCKET, Key: key, Body: body, ContentType: type, ContentLength: length || undefined }));
  return publicUrl(c, key);
}
