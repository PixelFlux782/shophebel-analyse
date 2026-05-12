import puppeteer, { Browser } from "puppeteer";

export class BrowserLaunchError extends Error {}

export async function launchBrowser(): Promise<Browser> {
  try {
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH?.trim() || undefined;

    return await puppeteer.launch({
      headless: true,
      executablePath,
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
      environment: process.env.VERCEL ? "vercel" : process.env.NODE_ENV,
      executablePathSet: Boolean(process.env.PUPPETEER_EXECUTABLE_PATH?.trim()),
    });
    throw new BrowserLaunchError(
      `Die echte Seitenansicht konnte nicht gestartet werden: ${message}`,
    );
  }
}
