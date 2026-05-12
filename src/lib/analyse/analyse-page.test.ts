import { afterEach, describe, expect, it, vi } from "vitest";

import { shouldPreferRenderedAnalysis } from "@/lib/analyse/analyse-page";

describe("rendered analysis policy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("nutzt rendered analysis im Development standardmaessig", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(shouldPreferRenderedAnalysis()).toBe(true);
  });

  it("nutzt static analysis, wenn rendered explizit deaktiviert ist", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SHOPHEBEL_RENDERED_ANALYSIS", "false");

    expect(shouldPreferRenderedAnalysis()).toBe(false);
  });

  it("aktiviert rendered analysis in Production per ENV-Schalter", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SHOPHEBEL_RENDERED_ANALYSIS", "true");

    expect(shouldPreferRenderedAnalysis()).toBe(true);
  });

  it("unterstuetzt den expliziten Modus-Schalter", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SHOPHEBEL_ANALYSIS_MODE", "rendered");

    expect(shouldPreferRenderedAnalysis()).toBe(true);

    vi.stubEnv("SHOPHEBEL_ANALYSIS_MODE", "static");

    expect(shouldPreferRenderedAnalysis()).toBe(false);
  });
});
