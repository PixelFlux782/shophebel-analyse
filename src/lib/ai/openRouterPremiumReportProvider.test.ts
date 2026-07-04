import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import type { PremiumPromptMessage } from "@/lib/ai/promptBuilder";
import type { PremiumReportProvider } from "@/lib/ai/premiumReportProvider";
import {
  createOpenRouterPremiumReportProvider,
  DEFAULT_OPENROUTER_MODEL,
  type OpenRouterProviderOptions,
} from "@/lib/ai/openRouterPremiumReportProvider";

const messages: PremiumPromptMessage[] = [
  {
    role: "system",
    content: "Antworte als JSON.",
  },
  {
    role: "user",
    content: "Erstelle den Premiumreport.",
  },
];

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  });
}

function createProvider(options: OpenRouterProviderOptions = {}) {
  return createOpenRouterPremiumReportProvider({
    apiKey: "test-openrouter-key",
    ...options,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_MODEL;
  delete process.env.OPENROUTER_SITE_URL;
  delete process.env.OPENROUTER_APP_NAME;
});

describe("openRouterPremiumReportProvider", () => {
  it("wirft bei fehlendem API-Key einen klaren Fehler", async () => {
    const fetchMock = vi.fn();
    const provider = createOpenRouterPremiumReportProvider({ fetchFn: fetchMock });

    await expect(provider.generate(messages)).rejects.toMatchObject({
      name: "OpenRouterProviderError",
      message: expect.stringContaining("OPENROUTER_API_KEY is required"),
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sendet an die OpenRouter Chat-Completions-URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { content: "{\"ok\":true}" } }],
      }),
    );

    await createProvider({ fetchFn: fetchMock }).generate(messages);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("sendet messages korrekt und fordert JSON mit niedriger temperature an", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { content: "{\"ok\":true}" } }],
      }),
    );

    await createProvider({ fetchFn: fetchMock, model: "openrouter/test-model" }).generate(messages);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as {
      model: string;
      messages: PremiumPromptMessage[];
      temperature: number;
      max_tokens: number;
      response_format: { type: string };
    };

    expect(body).toEqual({
      model: "openrouter/test-model",
      messages,
      temperature: 0.2,
      max_tokens: 1400,
      response_format: {
        type: "json_object",
      },
    });
  });

  it("setzt den Authorization Header ohne echten Key zu benoetigen", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { content: "{\"ok\":true}" } }],
      }),
    );

    await createProvider({
      fetchFn: fetchMock,
      siteUrl: "https://shophebel.example",
      appName: "Shophebel Test",
    }).generate(messages);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(init.headers).toMatchObject({
      Authorization: "Bearer test-openrouter-key",
      "Content-Type": "application/json",
      "HTTP-Referer": "https://shophebel.example",
      "X-OpenRouter-Title": "Shophebel Test",
    });
  });

  it("meldet HTTP-Fehler sauber", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("rate limit", { status: 429 }));

    await expect(createProvider({ fetchFn: fetchMock }).generate(messages)).rejects.toMatchObject({
      name: "OpenRouterProviderError",
      message: "OpenRouter request failed with HTTP 429: rate limit",
    });
  });

  it("meldet ungueltige OpenRouter-JSON-Response sauber", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("not json", {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    await expect(createProvider({ fetchFn: fetchMock }).generate(messages)).rejects.toMatchObject({
      name: "OpenRouterProviderError",
      message: expect.stringContaining("OpenRouter response is not valid JSON"),
    });
  });

  it("meldet fehlenden Message-Content sauber", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: {} }],
      }),
    );

    await expect(createProvider({ fetchFn: fetchMock }).generate(messages)).rejects.toMatchObject({
      name: "OpenRouterProviderError",
      message: "OpenRouter response did not include a message content string.",
    });
  });

  it("gibt bei Erfolg Content und Usage-Metadaten zurueck", async () => {
    const rawContent = "{\"executiveSummary\":\"Kurzfassung\"}";
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { content: rawContent } }],
        usage: {
          prompt_tokens: 120,
          completion_tokens: 80,
          total_tokens: 200,
          cost: 0.00042,
        },
      }),
    );

    await expect(createProvider({ fetchFn: fetchMock, model: "openrouter/test-model" }).generate(messages)).resolves.toEqual({
      content: rawContent,
      usage: {
        promptTokens: 120,
        completionTokens: 80,
        totalTokens: 200,
        estimatedCost: 0.00042,
        isEstimated: false,
      },
    });
    expect(infoSpy).toHaveBeenCalledWith(
      "[premium-ai-report:openrouter-usage]",
      expect.objectContaining({
        model: "openrouter/test-model",
        totalTokens: 200,
        promptTokens: 120,
        completionTokens: 80,
      }),
    );
  });

  it("nutzt env-Konfiguration und ein defensives Default-Modell", async () => {
    process.env.OPENROUTER_API_KEY = "env-key";
    process.env.OPENROUTER_SITE_URL = "https://env.example";
    process.env.OPENROUTER_APP_NAME = "Shophebel Env";
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { content: "{\"ok\":true}" } }],
      }),
    );

    await createOpenRouterPremiumReportProvider({ fetchFn: fetchMock }).generate(messages);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as { model: string };

    expect(body.model).toBe(DEFAULT_OPENROUTER_MODEL);
    expect(init.headers).toMatchObject({
      Authorization: "Bearer env-key",
      "HTTP-Referer": "https://env.example",
      "X-OpenRouter-Title": "Shophebel Env",
    });
  });

  it("haelt den PremiumReportProvider-Service-Contract unveraendert", () => {
    expectTypeOf(createOpenRouterPremiumReportProvider).returns.toEqualTypeOf<PremiumReportProvider>();
    expectTypeOf(createOpenRouterPremiumReportProvider().generate).parameters.toEqualTypeOf<
      [PremiumPromptMessage[]]
    >();
    expectTypeOf(createOpenRouterPremiumReportProvider().generate).returns.toEqualTypeOf<
      ReturnType<PremiumReportProvider["generate"]>
    >();

    const providerSource = readFileSync(
      join(process.cwd(), "src/lib/ai/openRouterPremiumReportProvider.ts"),
      "utf8",
    );
    const serviceSource = readFileSync(join(process.cwd(), "src/lib/ai/premiumReportService.ts"), "utf8");

    expect(providerSource).not.toMatch(/AnalysisResult/);
    expect(providerSource).not.toContain("@/types/analysis");
    expect(serviceSource).not.toMatch(/openrouter/i);
  });
});
