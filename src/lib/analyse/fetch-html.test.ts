import { lookup } from "node:dns/promises";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { FetchHtmlError, fetchHtml } from "@/lib/analyse/fetch-html";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(),
}));

const lookupMock = vi.mocked(lookup);

describe("fetchHtml", () => {
  beforeEach(() => {
    lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
  });

  it("blockt Redirects auf interne Zieladressen", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        url: "http://127.0.0.1/admin",
        headers: {
          get: () => "text/html; charset=utf-8",
        },
        text: async () => "<html><body>internal</body></html>",
      }),
    );

    await expect(fetchHtml("https://example.com")).rejects.toBeInstanceOf(FetchHtmlError);

    vi.unstubAllGlobals();
  });
});
