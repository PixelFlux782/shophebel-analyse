import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { getAnalysisResult, markAnalysisPending } from "@/lib/analysisStore";
import { APP_URL } from "@/lib/env";

export const runtime = "nodejs";

interface CheckoutRequestBody {
  analysisId?: string;
  productType?: string;
  plan?: string;
}

type CheckoutPlan = "full" | "premium";
type ProductType = "full_analysis" | "premium_report";
type AccessLevel = "full" | "premium";

const checkoutProducts: Record<CheckoutPlan, {
  productType: ProductType;
  envPriceId: string;
  legacyEnvPriceId?: string;
  amount: number;
  name: string;
  description: string;
}> = {
  full: {
    productType: "full_analysis",
    envPriceId: "STRIPE_FULL_ANALYSIS_PRICE_ID",
    amount: 500,
    name: "Shophebel Vollanalyse",
    description: "Vollstaendige automatisierte Website-Analyse mit Detailbewertungen und ersten Empfehlungen.",
  },
  premium: {
    productType: "premium_report",
    envPriceId: "STRIPE_PREMIUM_ANALYSIS_PRICE_ID",
    legacyEnvPriceId: "STRIPE_PRICE_ID",
    amount: 4900,
    name: "Shophebel Premium Analyse",
    description: "Strategischer Premium-Report mit Priorisierung, visueller Prüfung und 7-Tage-Fahrplan.",
  },
};

function normalizeProductType(value?: string): ProductType | null {
  if (value === "full_analysis") {
    return "full_analysis";
  }

  if (value === "premium_report") {
    return "premium_report";
  }

  return null;
}

function productTypeToAccessLevel(productType: ProductType): AccessLevel {
  if (productType === "full_analysis") {
    return "full";
  }

  return "premium";
}

function normalizeCheckoutPlan(body: CheckoutRequestBody): CheckoutPlan | null {
  if (body.plan === "full" || body.productType === "full_analysis") {
    return "full";
  }

  if (
    body.plan === "premium" ||
    body.plan === "premium_report" ||
    body.productType === "premium_report" ||
    !body.plan
  ) {
    return "premium";
  }

  return null;
}

function buildLineItem(product: (typeof checkoutProducts)[CheckoutPlan]) {
  const configuredPriceId =
    process.env[product.envPriceId]?.trim() ||
    (product.legacyEnvPriceId ? process.env[product.legacyEnvPriceId]?.trim() : undefined);

  if (configuredPriceId) {
    return {
      price: configuredPriceId,
      quantity: 1,
    };
  }

  return {
    price_data: {
      currency: "eur",
      product_data: {
        name: product.name,
        description: product.description,
      },
      unit_amount: product.amount,
    },
    quantity: 1,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutRequestBody;

    if (!body.analysisId) {
      return NextResponse.json(
        { error: "Keine Analyse-ID für den Checkout übergeben." },
        { status: 400 },
      );
    }

    if (body.productType && !normalizeProductType(body.productType)) {
      return NextResponse.json(
        { error: "Ungültiger Produkt-Typ für Checkout." },
        { status: 400 },
      );
    }

    const plan = normalizeCheckoutPlan(body);

    if (!plan) {
      return NextResponse.json(
        { error: "Unbekannter Analyseumfang für den Checkout." },
        { status: 400 },
      );
    }

    const analysis = await getAnalysisResult(body.analysisId);

    if (!analysis) {
      return NextResponse.json(
        { error: "Analyse für den Checkout nicht gefunden." },
        { status: 404 },
      );
    }

    const product = checkoutProducts[plan];
    const accessLevel = productTypeToAccessLevel(product.productType);
    const successUrl = new URL("/checkout/success", APP_URL);
    successUrl.searchParams.set("analysisId", body.analysisId);
    successUrl.searchParams.set("upgrade", plan);
    successUrl.searchParams.set("success", "true");
    const cancelUrl = new URL(`/analyse/result/${encodeURIComponent(body.analysisId)}`, APP_URL);

    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn("[checkout] Stripe Checkout is not configured.", {
        hasStripeSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
        hasFullPriceId: Boolean(process.env.STRIPE_FULL_ANALYSIS_PRICE_ID),
        hasPremiumPriceId: Boolean(process.env.STRIPE_PREMIUM_ANALYSIS_PRICE_ID || process.env.STRIPE_PRICE_ID),
        appUrl: APP_URL,
        analysisId: body.analysisId,
        plan,
      });

      if (process.env.NODE_ENV !== "production") {
        const demoUrl = `${APP_URL}/analyse/result/${encodeURIComponent(body.analysisId)}?checkout=demo&upgrade=${plan}`;
        return NextResponse.json({ url: demoUrl, demo: true });
      }

      return NextResponse.json(
        { error: "Stripe Checkout ist nicht konfiguriert." },
        { status: 503 },
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      line_items: [buildLineItem(product)],
      metadata: {
        analysisId: body.analysisId,
        productType: product.productType,
        accessLevel,
        plan,
      },
    });

    if (!session.url) {
      throw new Error("Stripe Checkout URL konnte nicht erstellt werden.");
    }

    await markAnalysisPending(body.analysisId, product.productType, accessLevel).catch((error) => {
      console.warn("[checkout] marking analysis pending failed", {
        reason: error instanceof Error ? error.message : "unknown",
        analysisId: body.analysisId,
        productType: product.productType,
        accessLevel,
      });
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Checkout konnte nicht erstellt werden.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
