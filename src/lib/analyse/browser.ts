import puppeteer, { Browser } from "puppeteer";

export class BrowserLaunchError extends Error {}

export async function launchBrowser(): Promise<Browser> {
  try {
    return await puppeteer.launch({
      headless: true,
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
    throw new BrowserLaunchError(
      `Die echte Seitenansicht konnte nicht gestartet werden: ${message}`,
    );
  }
}
