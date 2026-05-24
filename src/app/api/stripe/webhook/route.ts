import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

type CheckoutSessionMetadata = {
  analysisId?: string;
  url?: string;
  productType?: string;
  plan?: string;
};

type PaidPlan = "full" | "premium";

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    url: url.replace(/\/+$/, ""),
    serviceRoleKey,
  };
}

function getCustomerEmail(session: Stripe.Checkout.Session) {
  return session.customer_details?.email ?? session.customer_email ?? null;
}

async function hasProcessedStripeSession(sessionId: string) {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("Supabase is not configured for Stripe webhook persistence.");
  }

  const response = await fetch(
    `${config.url}/rest/v1/analysis_results?stripe_session_id=eq.${encodeURIComponent(sessionId)}&select=id&limit=1`,
    {
      method: "GET",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`supabase_payment_lookup_failed: ${response.status} ${details}`);
  }

  const rows = (await response.json()) as unknown[];
  return rows.length > 0;
}

async function markAnalysisPaid(input: {
  analysisId: string;
  session: Stripe.Checkout.Session;
  metadata: CheckoutSessionMetadata;
}) {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("Supabase is not configured for Stripe webhook persistence.");
  }

  const plan = normalizePaidPlan(input.metadata);
  const productType = normalizeProductType(input.metadata.productType);

  if (!productType || !plan) {
    console.warn("[stripe-webhook] checkout.session.completed with invalid productType metadata", {
      metadata: input.metadata,
    });
    return;
  }

  const payload = {
    updated_at: new Date().toISOString(),
    access_level: plan,
    payment_status: "paid",
    paid_at: new Date().toISOString(),
    stripe_session_id: input.session.id,
    stripe_customer_email: getCustomerEmail(input.session),
    product_type: productType,
    plan,
    is_premium: plan === "premium",
  };

  const response = await fetch(
    `${config.url}/rest/v1/analysis_results?id=eq.${encodeURIComponent(input.analysisId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`supabase_payment_update_failed: ${response.status} ${details}`);
  }
}

function normalizeProductType(value?: string): "full_analysis" | "premium_report" | null {
  if (value === "full_analysis") {
    return "full_analysis";
  }

  if (value === "premium_report") {
    return "premium_report";
  }

  return null;
}

function normalizePaidPlan(metadata: CheckoutSessionMetadata): PaidPlan | null {
  if (metadata.productType === "full_analysis") {
    return "full";
  }

  if (metadata.productType === "premium_report") {
    return "premium";
  }

  if (metadata.plan === "full") {
    return "full";
  }

  if (metadata.plan === "premium") {
    return "premium";
  }

  return null;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = (session.metadata ?? {}) as CheckoutSessionMetadata;
  const analysisId = metadata.analysisId?.trim();

  if (session.payment_status !== "paid") {
    console.warn("[stripe-webhook] checkout.session.completed without paid payment_status", {
      sessionId: session.id,
      paymentStatus: session.payment_status,
    });
    return;
  }

  if (!analysisId) {
    console.warn("[stripe-webhook] checkout.session.completed without analysisId metadata");
    return;
  }

  const productType = normalizeProductType(metadata.productType);

  if (!productType) {
    console.warn("[stripe-webhook] checkout.session.completed without valid productType metadata", {
      metadata,
    });
    return;
  }

  if (await hasProcessedStripeSession(session.id)) {
    return;
  }

  await markAnalysisPaid({
    analysisId,
    session,
    metadata,
  });
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();

  if (!webhookSecret) {
    console.error("[stripe-webhook] missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Stripe webhook secret is missing." }, { status: 503 });
  }

  if (!stripeSecret) {
    console.error("[stripe-webhook] missing STRIPE_SECRET_KEY");
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("[stripe-webhook] missing stripe-signature header");
    return NextResponse.json({ error: "Stripe signature is missing." }, { status: 400 });
  }

  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch (error) {
    console.error("[stripe-webhook] raw body read failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Stripe webhook body could not be read." }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecret);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Stripe signature.";
    console.error("[stripe-webhook] constructEvent failed", {
      reason: message,
      hasSignature: Boolean(signature),
      rawBodyLength: rawBody.length,
    });
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[stripe-webhook] processing failed", error);
    return NextResponse.json({ error: "Stripe webhook processing failed." }, { status: 500 });
  }
}
