import { mkdir, stat, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const GENERATED_SCREENSHOT_DIR = path.join(
  process.cwd(),
  "public",
  "generated-screenshots",
);

function getSupabaseScreenshotConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = process.env.SUPABASE_SCREENSHOT_BUCKET?.trim();
  const publicBaseUrl = process.env.SUPABASE_SCREENSHOT_PUBLIC_BASE_URL?.trim();

  if (!url || !serviceRoleKey || !bucket) {
    return null;
  }

  return {
    url: url.replace(/\/+$/, ""),
    serviceRoleKey,
    bucket,
    publicBaseUrl: publicBaseUrl?.replace(/\/+$/, ""),
  };
}

function encodeStoragePath(value: string) {
  return value.split("/").map(encodeURIComponent).join("/");
}

function buildSupabaseStorageUrl(input: {
  supabaseUrl: string;
  bucket: string;
  storagePath: string;
  publicBaseUrl?: string;
}) {
  const encodedBucket = encodeURIComponent(input.bucket);
  const encodedPath = encodeStoragePath(input.storagePath);

  if (input.publicBaseUrl) {
    return `${input.publicBaseUrl}/${encodedPath}`;
  }

  return `${input.supabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
}

function toArrayBuffer(buffer: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(buffer.byteLength);
  copy.set(buffer);

  return copy.buffer;
}

async function saveScreenshotBufferSupabase(input: {
  buffer: Uint8Array;
  prefix: string;
  variant: string;
}) {
  const config = getSupabaseScreenshotConfig();

  if (!config) {
    console.warn("[screenshot-storage] Supabase screenshot storage is not configured.", {
      supabaseUrlSet: Boolean(process.env.SUPABASE_URL?.trim()),
      serviceRoleKeySet: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
      screenshotBucketSet: Boolean(process.env.SUPABASE_SCREENSHOT_BUCKET?.trim()),
    });
    return undefined;
  }

  const filename = `${input.variant}-${Date.now()}-${randomUUID()}.png`;
  const storagePath = `analysis-results/${input.prefix}/${filename}`;
  const requestUrl = `${config.url}/storage/v1/object/${encodeURIComponent(config.bucket)}/${encodeStoragePath(storagePath)}`;

  console.info("[screenshot-storage] Supabase upload started", {
    bucket: config.bucket,
    storagePath,
    variant: input.variant,
    bytes: input.buffer.byteLength,
  });

  try {
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "image/png",
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "x-upsert": "false",
      },
      body: new Blob([toArrayBuffer(input.buffer)], { type: "image/png" }),
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      console.warn("[screenshot-storage] Supabase upload failed", {
        status: response.status,
        details,
        bucket: config.bucket,
        storagePath,
        variant: input.variant,
      });
      return undefined;
    }

    const publicUrl = buildSupabaseStorageUrl({
      supabaseUrl: config.url,
      bucket: config.bucket,
      storagePath,
      publicBaseUrl: config.publicBaseUrl,
    });

    console.info("[screenshot-storage] Supabase upload succeeded", {
      bucket: config.bucket,
      storagePath,
      variant: input.variant,
      publicUrl,
    });

    return publicUrl;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown upload error";
    console.warn("[screenshot-storage] Supabase upload failed", {
      reason: message,
      bucket: config.bucket,
      storagePath,
      variant: input.variant,
    });
    return undefined;
  }
}

export async function ensureScreenshotStorage() {
  await mkdir(GENERATED_SCREENSHOT_DIR, { recursive: true });
}

export async function saveScreenshotBuffer(input: {
  buffer: Uint8Array;
  prefix: string;
  variant: string;
}) {
  if (process.env.NODE_ENV === "production") {
    if (process.env.VERCEL && !process.env.SUPABASE_SCREENSHOT_BUCKET?.trim()) {
      console.warn(
        "[screenshot-storage] Vercel production cannot persist generated screenshots locally. Set SUPABASE_SCREENSHOT_BUCKET to enable visual previews.",
      );
    }

    return saveScreenshotBufferSupabase(input);
  }

  await ensureScreenshotStorage();

  const filename = `${input.prefix}-${input.variant}-${Date.now()}-${randomUUID()}.png`;
  const absolutePath = path.join(GENERATED_SCREENSHOT_DIR, filename);

  try {
    await writeFile(absolutePath, input.buffer);
    const fileStats = await stat(absolutePath);

    if (!fileStats.isFile() || fileStats.size <= 0) {
      console.warn("[screenshot-storage] Local screenshot write produced an empty or missing file", {
        path: absolutePath,
        variant: input.variant,
        bytes: fileStats.size,
      });

      return undefined;
    }

    console.info("[screenshot-storage] Local screenshot stored", {
      path: absolutePath,
      variant: input.variant,
      bytes: fileStats.size,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown local storage error";

    console.warn("[screenshot-storage] Local screenshot storage failed", {
      path: absolutePath,
      variant: input.variant,
      reason: message,
    });

    return undefined;
  }

  return `/generated-screenshots/${filename}`;
}
