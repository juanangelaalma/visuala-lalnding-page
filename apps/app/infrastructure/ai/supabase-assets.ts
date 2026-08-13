import "server-only";

import { Readable, Transform } from "node:stream";
import { z } from "zod";
import { createSupabaseServiceRoleClient } from "@/infrastructure/supabase/service-role-client";

const BUCKET = "ai-assets";
const MAX_BYTES = 100 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 900;
const allowed = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/webm", "audio/mpeg", "audio/wav"]);
const atlasAssetHostsSchema = z.object({
  ATLAS_ASSET_HOSTS: z.string().min(1),
});

function getAtlasAssetHosts() {
  const { ATLAS_ASSET_HOSTS } = atlasAssetHostsSchema.parse({
    ATLAS_ASSET_HOSTS: process.env.ATLAS_ASSET_HOSTS,
  });
  return new Set(ATLAS_ASSET_HOSTS.split(",").map((host) => host.trim().toLowerCase()).filter(Boolean));
}

function rejectInvalidAsset(body: Uint8Array, contentType: string) {
  if (!allowed.has(contentType) || body.byteLength > MAX_BYTES) throw new Error("Asset rejected");
}

export async function uploadAsset(body: Uint8Array, contentType: string, key: string) {
  rejectInvalidAsset(body, contentType);
  const { error } = await createSupabaseServiceRoleClient().storage.from(BUCKET).upload(key, body, { contentType, upsert: false });
  if (error) throw new Error("Could not store asset");
  return key;
}

export async function copyRemoteAsset(url: string, key: string) {
  const source = new URL(url);
  if (source.protocol !== "https:" || !getAtlasAssetHosts().has(source.hostname.toLowerCase())) {
    throw new Error("Provider asset host rejected");
  }

  let response: Response;
  try {
    response = await fetch(source, { signal: AbortSignal.timeout(30_000), redirect: "manual" });
  } catch {
    throw new Error("Could not copy provider asset");
  }
  if (response.status >= 300 && response.status < 400) throw new Error("Provider asset redirect rejected");
  if (!response.ok || !response.body) throw new Error(`Could not copy provider asset (${response.status})`);
  const contentType = response.headers.get("content-type")?.split(";")[0] ?? "";
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (!allowed.has(contentType) || contentLength > MAX_BYTES) throw new Error("Provider asset rejected");

  const body = limitResponseBody(response.body);
  const { error } = await createSupabaseServiceRoleClient().storage.from(BUCKET).upload(key, body, { contentType, upsert: false });
  if (error) throw new Error("Could not store asset");
  return key;
}

export async function createSignedAssetUrl(path: string) {
  const { data, error } = await createSupabaseServiceRoleClient().storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) throw new Error("Could not sign asset");
  return data.signedUrl;
}

export function createSignedAssetUrls(paths: string[]) {
  return Promise.all(paths.map(createSignedAssetUrl));
}

function limitResponseBody(body: ReadableStream<Uint8Array>) {
  let received = 0;
  const limiter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      received += chunk.byteLength;
      callback(received > MAX_BYTES ? new Error("Provider asset is too large") : null, chunk);
    },
  });
  return Readable.fromWeb(body as import("node:stream/web").ReadableStream).pipe(limiter);
}
