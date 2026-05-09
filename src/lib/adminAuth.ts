import { NextResponse } from "next/server";

export function isAdminHeaders(headers: Headers) {
  const configuredToken = process.env.ADMIN_API_TOKEN?.trim();

  if (!configuredToken) {
    return false;
  }

  const authorization = headers.get("authorization")?.trim();
  const bearerToken = authorization?.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";
  const headerToken = headers.get("x-admin-token")?.trim();

  return bearerToken === configuredToken || headerToken === configuredToken;
}

export function isAdminRequest(request: Request) {
  return isAdminHeaders(request.headers);
}

export function adminUnauthorizedResponse() {
  const configured = Boolean(process.env.ADMIN_API_TOKEN?.trim());

  return NextResponse.json(
    {
      error: configured
        ? "Admin-Zugriff nicht autorisiert."
        : "Admin-Zugriff ist nicht konfiguriert. Setze ADMIN_API_TOKEN.",
    },
    { status: configured ? 401 : 503 },
  );
}
