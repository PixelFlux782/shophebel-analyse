import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const LOCALHOST_HOSTNAME = "localhost";

export class PublicUrlError extends Error {}

export function normalizeUrl(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("Bitte gib eine URL ein.");
  }

  const hasExplicitScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);
  const normalized = hasExplicitScheme ? trimmed : `https://${trimmed}`;
  const parsed = new URL(normalized);

  if (!/^https?:$/i.test(parsed.protocol)) {
    throw new Error("Bitte gib eine gültige Webadresse mit http:// oder https:// ein.");
  }

  if (!parsed.hostname) {
    throw new Error("Die URL ist ungültig.");
  }

  return {
    fullUrl: parsed.toString(),
    hostname: parsed.hostname,
  };
}

function stripIpv6Brackets(hostname: string): string {
  return hostname.replace(/^\[/, "").replace(/\]$/, "");
}

function parseIpv4Address(address: string): number[] | null {
  const parts = address.split(".");

  if (parts.length !== 4) {
    return null;
  }

  const octets = parts.map((part) => {
    if (!/^\d+$/.test(part)) {
      return Number.NaN;
    }

    return Number.parseInt(part, 10);
  });

  return octets.every((octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255)
    ? octets
    : null;
}

function parseIpv4MappedIpv6(address: string): number[] | null {
  const normalized = stripIpv6Brackets(address).toLowerCase();

  if (!normalized.startsWith("::ffff:")) {
    return null;
  }

  const mapped = normalized.slice("::ffff:".length);
  const dotted = parseIpv4Address(mapped);

  if (dotted) {
    return dotted;
  }

  const hexParts = mapped.split(":");

  if (hexParts.length !== 2 || !hexParts.every((part) => /^[0-9a-f]{1,4}$/i.test(part))) {
    return null;
  }

  const high = Number.parseInt(hexParts[0], 16);
  const low = Number.parseInt(hexParts[1], 16);

  return [(high >> 8) & 255, high & 255, (low >> 8) & 255, low & 255];
}

function isBlockedIpv4(address: string): boolean {
  const octets = parseIpv4Address(address);

  if (!octets) {
    return false;
  }

  const [first, second] = octets;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first >= 224 && first <= 239) ||
    first >= 240
  );
}

function isBlockedIpv6(address: string): boolean {
  const normalized = stripIpv6Brackets(address).toLowerCase();
  const mappedIpv4 = parseIpv4MappedIpv6(normalized);

  if (mappedIpv4) {
    return isBlockedIpv4(mappedIpv4.join("."));
  }

  if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") {
    return true;
  }

  const firstHextet = normalized.split(":").find((part) => part.length > 0);

  if (!firstHextet || !/^[0-9a-f]{1,4}$/i.test(firstHextet)) {
    return false;
  }

  const first = Number.parseInt(firstHextet, 16);

  return (first & 0xfe00) === 0xfc00 || (first & 0xffc0) === 0xfe80;
}

function isBlockedIpAddress(address: string): boolean {
  const normalized = stripIpv6Brackets(address);
  const family = isIP(normalized);

  if (family === 4) {
    return isBlockedIpv4(normalized);
  }

  if (family === 6) {
    return isBlockedIpv6(normalized);
  }

  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = stripIpv6Brackets(hostname).toLowerCase().replace(/\.$/, "");

  return normalized === LOCALHOST_HOSTNAME || normalized.endsWith(`.${LOCALHOST_HOSTNAME}`);
}

export async function assertPublicHttpUrl(input: string): Promise<URL> {
  let parsed: URL;

  try {
    parsed = new URL(normalizeUrl(input).fullUrl);
  } catch (error) {
    throw new PublicUrlError(
      error instanceof Error ? error.message : "Die URL ist ungültig.",
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new PublicUrlError("Bitte gib eine gültige Webadresse mit http:// oder https:// ein.");
  }

  if (isBlockedHostname(parsed.hostname) || isBlockedIpAddress(parsed.hostname)) {
    throw new PublicUrlError("Diese URL kann aus Sicherheitsgruenden nicht geprüft werden.");
  }

  try {
    const addresses = await lookup(parsed.hostname, { all: true, verbatim: true });

    if (addresses.some((entry) => isBlockedIpAddress(entry.address))) {
      throw new PublicUrlError("Diese URL kann aus Sicherheitsgruenden nicht geprüft werden.");
    }
  } catch (error) {
    if (error instanceof PublicUrlError) {
      throw error;
    }

    throw new PublicUrlError("Die URL konnte nicht aufgeloest werden.");
  }

  return parsed;
}
