import type { PremiumPromptMessage } from "@/lib/ai/promptBuilder";
import type { PremiumReportProvider, PremiumReportProviderResult, PremiumReportUsage } from "@/lib/ai/premiumReportProvider";

const OPENROUTER_CHAT_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4o-mini";
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_TOKENS = 1_400;

export type OpenRouterProviderOptions = {
  apiKey?: string;
  model?: string;
  siteUrl?: string;
  appName?: string;
  timeoutMs?: number;
  maxTokens?: number;
  fetchFn?: typeof fetch;
};

type OpenRouterMessage = {
  role: PremiumPromptMessage["role"];
  content: string;
};

type OpenRouterChoice = {
  message?: {
    content?: unknown;
  };
};

type OpenRouterResponseBody = {
  choices?: OpenRouterChoice[];
  usage?: {
    prompt_tokens?: unknown;
    completion_tokens?: unknown;
    total_tokens?: unknown;
    cost?: unknown;
  };
};

export class OpenRouterProviderError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "OpenRouterProviderError";
  }
}

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();

  return value ? value : undefined;
}

function resolveConfig(options: OpenRouterProviderOptions = {}) {
  const apiKey = options.apiKey?.trim() || readEnv("OPENROUTER_API_KEY");

  if (!apiKey) {
    throw new OpenRouterProviderError("OPENROUTER_API_KEY is required to use the OpenRouter premium report provider.");
  }

  return {
    apiKey,
    model: options.model?.trim() || readEnv("OPENROUTER_MODEL") || DEFAULT_OPENROUTER_MODEL,
    siteUrl: options.siteUrl?.trim() || readEnv("OPENROUTER_SITE_URL"),
    appName: options.appName?.trim() || readEnv("OPENROUTER_APP_NAME"),
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    maxTokens: (options.maxTokens ?? Number(readEnv("OPENROUTER_MAX_TOKENS"))) || DEFAULT_MAX_TOKENS,
    fetchFn: options.fetchFn ?? fetch,
  };
}

function buildHeaders(config: ReturnType<typeof resolveConfig>): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  };

  if (config.siteUrl) {
    headers["HTTP-Referer"] = config.siteUrl;
  }

  if (config.appName) {
    headers["X-OpenRouter-Title"] = config.appName;
  }

  return headers;
}

async function withTimeout<T>(timeoutMs: number, operation: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await operation(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new OpenRouterProviderError(`OpenRouter request timed out after ${timeoutMs}ms.`, { cause: error });
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseUsage(value: OpenRouterResponseBody["usage"]): PremiumReportUsage | null {
  if (!value) {
    return null;
  }

  const usage = {
    promptTokens: numberOrNull(value.prompt_tokens),
    completionTokens: numberOrNull(value.completion_tokens),
    totalTokens: numberOrNull(value.total_tokens),
    estimatedCost: numberOrNull(value.cost),
    isEstimated: false,
  };

  return Object.values(usage).some((item) => item !== null && item !== false) ? usage : null;
}

async function parseOpenRouterResponse(response: Response, model: string): Promise<PremiumReportProviderResult> {
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const detail = body.trim() ? `: ${body.slice(0, 500)}` : "";

    throw new OpenRouterProviderError(`OpenRouter request failed with HTTP ${response.status}${detail}`);
  }

  let parsed: unknown;

  try {
    parsed = await response.json();
  } catch (error) {
    throw new OpenRouterProviderError("OpenRouter response is not valid JSON.", { cause: error });
  }

  const body = parsed as OpenRouterResponseBody;
  const content = body.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new OpenRouterProviderError("OpenRouter response did not include a message content string.");
  }

  const usage = parseUsage(body.usage);

  if (usage) {
    console.info("[premium-ai-report:openrouter-usage]", {
      model,
      totalTokens: usage.totalTokens,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      estimatedCost: usage.estimatedCost,
      isEstimated: usage.isEstimated,
    });
  }

  return { content, usage };
}

export function createOpenRouterPremiumReportProvider(
  options: OpenRouterProviderOptions = {},
): PremiumReportProvider {
  return {
    async generate(messages) {
      const config = resolveConfig(options);
      const openRouterMessages: OpenRouterMessage[] = messages.map((message) => ({
        role: message.role,
        content: message.content,
      }));

      const response = await withTimeout(config.timeoutMs, (signal) =>
        config.fetchFn(OPENROUTER_CHAT_COMPLETIONS_URL, {
          method: "POST",
          headers: buildHeaders(config),
          signal,
          body: JSON.stringify({
            model: config.model,
            messages: openRouterMessages,
            temperature: 0.2,
            max_tokens: config.maxTokens,
            response_format: {
              type: "json_object",
            },
          }),
        }),
      );

      return parseOpenRouterResponse(response, config.model);
    },
  };
}

export { DEFAULT_OPENROUTER_MODEL };
