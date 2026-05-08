import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const GENERATED_SCREENSHOT_DIR = path.join(
  process.cwd(),
  "public",
  "generated-screenshots",
);

export async function ensureScreenshotStorage() {
  await mkdir(GENERATED_SCREENSHOT_DIR, { recursive: true });
}

export async function saveScreenshotBuffer(input: {
  buffer: Uint8Array;
  prefix: string;
  variant: string;
}) {
  await ensureScreenshotStorage();

  const filename = `${input.prefix}-${input.variant}-${Date.now()}-${randomUUID()}.png`;
  const absolutePath = path.join(GENERATED_SCREENSHOT_DIR, filename);

  await writeFile(absolutePath, input.buffer);

  return `/generated-screenshots/${filename}`;
}
