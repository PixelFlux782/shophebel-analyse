import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface ContactRequestBody {
  analysisId?: string;
  url?: string;
  productType?: string;
  topic?: string;
}

interface StoredContactRequest {
  id: string;
  createdAt: string;
  status: "new";
  productType: "premium_report";
  topic: string;
  analysisId: string;
  url: string;
}

function contactRequestsFilePath() {
  return path.join(process.cwd(), "data", "contact-requests.json");
}

async function readExistingRequests() {
  try {
    const raw = await readFile(contactRequestsFilePath(), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  let body: ContactRequestBody;

  try {
    body = (await request.json()) as ContactRequestBody;
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const analysisId = body.analysisId?.trim();
  const url = body.url?.trim();

  if (!analysisId) {
    return NextResponse.json({ error: "Analyse-ID fehlt." }, { status: 400 });
  }

  if (!url) {
    return NextResponse.json({ error: "URL fehlt." }, { status: 400 });
  }

  if (body.productType !== "premium_report") {
    return NextResponse.json({ error: "Nur Premium-Report-Anfragen werden unterstuetzt." }, { status: 400 });
  }

  const entry: StoredContactRequest = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: "new",
    productType: "premium_report",
    topic: body.topic?.trim() || "Premium Report",
    analysisId,
    url,
  };

  try {
    const filePath = contactRequestsFilePath();
    await mkdir(path.dirname(filePath), { recursive: true });
    const existing = await readExistingRequests();
    existing.push(entry);
    await writeFile(filePath, JSON.stringify(existing, null, 2), "utf8");

    return NextResponse.json({ success: true, id: entry.id }, { status: 201 });
  } catch (error) {
    console.error("[contact-api] premium report request failed", error);
    return NextResponse.json({ error: "Anfrage konnte nicht gespeichert werden." }, { status: 500 });
  }
}
