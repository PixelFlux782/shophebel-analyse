import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { saveScreenshotBuffer } from "@/lib/analyse/screenshot-storage";
import { captureAnalysisScreenshots } from "@/lib/analyse/screenshots";

const { mkdirMock, writeFileMock } = vi.hoisted(() => ({
  mkdirMock: vi.fn(),
  writeFileMock: vi.fn(),
}));

vi.mock("fs/promises", () => ({
  mkdir: mkdirMock,
  writeFile: writeFileMock,
}));

function createScreenshotPage() {
  return {
    screenshot: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    viewport: vi.fn().mockReturnValue({
      width: 1280,
      height: 720,
      deviceScaleFactor: 1,
      isMobile: false,
    }),
    setViewport: vi.fn().mockResolvedValue(undefined),
  };
}

describe("screenshot-storage", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("SUPABASE_SCREENSHOT_BUCKET", "");
    vi.stubEnv("SUPABASE_SCREENSHOT_PUBLIC_BASE_URL", "");
    mkdirMock.mockResolvedValue(undefined);
    writeFileMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("speichert Screenshots in Development lokal", async () => {
    const result = await saveScreenshotBuffer({
      buffer: new Uint8Array([1, 2, 3]),
      prefix: "analysis-test",
      variant: "viewport",
    });

    expect(result).toMatch(/^\/generated-screenshots\/analysis-test-viewport-/);
    expect(mkdirMock).toHaveBeenCalledTimes(1);
    expect(writeFileMock).toHaveBeenCalledTimes(1);
  });

  it("schreibt in Production ohne Storage nicht ins lokale Dateisystem", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const result = await saveScreenshotBuffer({
      buffer: new Uint8Array([1, 2, 3]),
      prefix: "analysis-test",
      variant: "viewport",
    });

    expect(result).toBeUndefined();
    expect(mkdirMock).not.toHaveBeenCalled();
    expect(writeFileMock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      "[screenshot-storage] Supabase screenshot storage is not configured.",
    );
  });

  it("laedt Screenshots in Production mit Supabase Storage hoch", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co/");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "secret-service-role-key");
    vi.stubEnv("SUPABASE_SCREENSHOT_BUCKET", "analysis-screenshots");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));

    const result = await saveScreenshotBuffer({
      buffer: new Uint8Array([1, 2, 3]),
      prefix: "analysis-test",
      variant: "viewport",
    });

    expect(result).toMatch(
      /^https:\/\/example\.supabase\.co\/storage\/v1\/object\/public\/analysis-screenshots\/analysis-results\/analysis-test\/viewport-/,
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(
        /^https:\/\/example\.supabase\.co\/storage\/v1\/object\/analysis-screenshots\/analysis-results\/analysis-test\/viewport-/,
      ),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "image/png",
          apikey: "secret-service-role-key",
          Authorization: "Bearer secret-service-role-key",
          "x-upsert": "false",
        }),
      }),
    );
    expect(mkdirMock).not.toHaveBeenCalled();
    expect(writeFileMock).not.toHaveBeenCalled();
  });

  it("nutzt optional eine konfigurierte Public Base URL", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "secret-service-role-key");
    vi.stubEnv("SUPABASE_SCREENSHOT_BUCKET", "analysis-screenshots");
    vi.stubEnv("SUPABASE_SCREENSHOT_PUBLIC_BASE_URL", "https://cdn.example.com/screenshots/");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));

    const result = await saveScreenshotBuffer({
      buffer: new Uint8Array([1, 2, 3]),
      prefix: "analysis-test",
      variant: "mobile",
    });

    expect(result).toMatch(
      /^https:\/\/cdn\.example\.com\/screenshots\/analysis-results\/analysis-test\/mobile-/,
    );
  });

  it("gibt bei Supabase Upload-Fehlern undefined zurueck", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "secret-service-role-key");
    vi.stubEnv("SUPABASE_SCREENSHOT_BUCKET", "analysis-screenshots");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bucket not found", { status: 404 })));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const result = await saveScreenshotBuffer({
      buffer: new Uint8Array([1, 2, 3]),
      prefix: "analysis-test",
      variant: "viewport",
    });

    expect(result).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      "[screenshot-storage] Supabase upload failed: 404 bucket not found",
    );
    expect(mkdirMock).not.toHaveBeenCalled();
    expect(writeFileMock).not.toHaveBeenCalled();
  });

  it("bricht die Screenshot-Erfassung in Production ohne Storage nicht ab", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const page = createScreenshotPage();
    const result = await captureAnalysisScreenshots(
      page as never,
      "analysis-test",
    );

    expect(result).toEqual({
      viewport: undefined,
      fullPage: undefined,
      mobile: undefined,
    });
    expect(page.screenshot).toHaveBeenCalledTimes(3);
    expect(mkdirMock).not.toHaveBeenCalled();
    expect(writeFileMock).not.toHaveBeenCalled();
  });
});
