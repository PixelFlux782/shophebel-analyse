import type { Browser } from "puppeteer-core";

export class BrowserLaunchError extends Error {}

type SparticuzChromium = typeof import("@sparticuz/chromium")["default"] & {
  defaultViewport?: {
    width: number;
    height: number;
    deviceScaleFactor?: number;
    isMobile?: boolean;
  };
  headless?: boolean | "shell";
};

function getRuntimeLabel() {
  if (process.env.VERCEL) {
    return "vercel";
  }

  return process.env.NODE_ENV ?? "unknown";
}

function shouldUseServerlessChromium() {
  return process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
}

export async function launchBrowser(): Promise<Browser> {
  const executablePathOverride = process.env.PUPPETEER_EXECUTABLE_PATH?.trim() || undefined;
  const runtime = getRuntimeLabel();
  const useServerlessChromium = shouldUseServerlessChromium();

  console.info("[analysis] browser launch started", {
    runtime,
    strategy: useServerlessChromium ? "puppeteer-core_sparticuz_chromium" : "puppeteer_bundled",
    executablePathSource: executablePathOverride ? "PUPPETEER_EXECUTABLE_PATH" : "auto",
    executablePath: executablePathOverride ?? null,
  });

  try {
    if (useServerlessChromium) {
      const [{ default: chromiumModule }, puppeteer] = await Promise.all([
        import("@sparticuz/chromium"),
        import("puppeteer-core"),
      ]);
      const chromium = chromiumModule as SparticuzChromium;
      const executablePath = executablePathOverride ?? await chromium.executablePath();
      const headless = chromium.headless ?? "shell";
      const defaultViewport = chromium.defaultViewport ?? {
        width: 1280,
        height: 720,
        deviceScaleFactor: 1,
      };

      console.info("[analysis] browser executable resolved", {
        runtime,
        strategy: "puppeteer-core_sparticuz_chromium",
        executablePathSource: executablePathOverride ? "PUPPETEER_EXECUTABLE_PATH" : "@sparticuz/chromium",
        executablePath,
        binDirectoryExpected: "node_modules/@sparticuz/chromium/bin",
        headless,
      });

      return await puppeteer.launch({
        args: puppeteer.defaultArgs({ args: chromium.args, headless }),
        defaultViewport,
        executablePath,
        headless,
      });
    }

    const puppeteer = await import("puppeteer");

    return await puppeteer.launch({
      headless: true,
      executablePath: executablePathOverride,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-background-networking",
      ],
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Die echte Seitenansicht konnte nicht gestartet werden.";
    console.warn("[analysis] browser launch failed", {
      reason: message,
      runtime,
      strategy: useServerlessChromium ? "puppeteer-core_sparticuz_chromium" : "puppeteer_bundled",
      executablePathSet: Boolean(executablePathOverride),
    });
    throw new BrowserLaunchError(
      `Die echte Seitenansicht konnte nicht gestartet werden: ${message}`,
    );
  }
}
