import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { APP_URL } from "@/lib/env";

export const runtime = "nodejs";

interface CheckoutRequestBody {
  analysisId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutRequestBody;

    if (!body.analysisId) {
      return NextResponse.json(
        { error: "Keine Analyse-ID fuer den Checkout uebergeben." },
        { status: 400 },
      );
    }

    const successUrl = `${APP_URL}/checkout/success?analysis=${encodeURIComponent(body.analysisId)}`;

    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
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
      success_url: successUrl,
      cancel_url: `${APP_URL}/analyse/result/${body.analysisId}`,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      metadata: {
        analysisId: body.analysisId,
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
