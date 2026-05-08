import { lookup } from "node:dns/promises";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { PublicUrlError, assertPublicHttpUrl } from "@/lib/urlUtils";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(),
}));

const lookupMock = vi.mocked(lookup);

describe("assertPublicHttpUrl", () => {
  beforeEach(() => {
    lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
  });

  it("erlaubt oeffentliche HTTP- und HTTPS-URLs", async () => {
    await expect(assertPublicHttpUrl("example.com")).resolves.toMatchObject({
      protocol: "https:",
      hostname: "example.com",
    });

    await expect(assertPublicHttpUrl("http://example.com/path")).resolves.toMatchObject({
      protocol: "http:",
      hostname: "example.com",
    });
  });

  it.each([
    "http://localhost",
    "http://shop.localhost",
    "http://127.0.0.1",
    "http://0.0.0.1",
    "http://10.1.2.3",
    "http://100.64.0.1",
    "http://169.254.169.254",
    "http://172.16.0.1",
    "http://192.168.1.10",
    "http://224.0.0.1",
    "http://240.0.0.1",
    "http://[::1]",
    "http://[fc00::1]",
    "http://[fe80::1]",
    "http://[::ffff:127.0.0.1]",
    "ftp://example.com",
  ])("blockt interne oder nicht erlaubte URL %s", async (url) => {
    await expect(assertPublicHttpUrl(url)).rejects.toBeInstanceOf(PublicUrlError);
  });

  it("blockt Hostnames, die per DNS auf private IPs zeigen", async () => {
    lookupMock.mockResolvedValue([{ address: "192.168.1.20", family: 4 }]);

    await expect(assertPublicHttpUrl("https://private.example")).rejects.toBeInstanceOf(PublicUrlError);
  });
});
