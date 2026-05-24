import { describe, expect, it } from "vitest";

import { getVisualPreviewCardState } from "@/components/results/visual-preview-card";

describe("VisualPreviewCard", () => {
  it("behandelt mobile-only Screenshots als vorhandene Preview", () => {
    const state = getVisualPreviewCardState({
      mobile: "/generated-screenshots/analysis-test-mobile.png",
    });

    expect(state).toEqual({
      hasPreview: true,
      primaryVariant: "mobile",
      primaryImage: "/generated-screenshots/analysis-test-mobile.png",
    });
  });
});
