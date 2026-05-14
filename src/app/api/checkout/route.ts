import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { APP_URL } from "@/lib/env";

export const runtime = "nodejs";

interface CheckoutRequestBody {
  analysisId?: string;
  productType?: string;
  plan?: string;
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

    const successUrl = new URL("/checkout/success", APP_URL);
    successUrl.searchParams.set("analysisId", body.analysisId);
    const cancelUrl = new URL(`/analyse/result/${encodeURIComponent(body.analysisId)}`, APP_URL);

    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
      console.warn("[checkout] Stripe Checkout is not configured.", {
        hasStripeSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
        hasStripePriceId: Boolean(process.env.STRIPE_PRICE_ID),
        appUrl: APP_URL,
        analysisId: body.analysisId,
      });

      if (process.env.NODE_ENV !== "production") {
        const demoUrl = `${APP_URL}/analyse/result/${encodeURIComponent(body.analysisId)}?checkout=demo`;
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
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      metadata: {
        analysisId: body.analysisId,
        productType: body.productType || "premium_report",
        plan: body.plan || "premium_report",
      },
    });

    if (!session.url) {
      throw new Error("Stripe Checkout URL konnte nicht erstellt werden.");
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Checkout konnte nicht erstellt werden.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
