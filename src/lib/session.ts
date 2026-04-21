import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/constants";

export type SessionPayload = {
  exp: number;
  iat: number;
  role: "admin";
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is missing.");
  }

  return secret;
}

function toBase64Url(bytes: Uint8Array) {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value: string) {
  const padded = value
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");

  const binary = atob(padded);

  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function importKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken() {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    role: "admin",
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
  };

  const payloadBytes = encoder.encode(JSON.stringify(payload));
  const payloadPart = toBase64Url(payloadBytes);
  const key = await importKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadPart));
  const signaturePart = toBase64Url(new Uint8Array(signature));

  return `${payloadPart}.${signaturePart}`;
}

export async function verifySessionToken(token: string | undefined | null) {
  if (!token) {
    return null;
  }

  const [payloadPart, signaturePart] = token.split(".");

  if (!payloadPart || !signaturePart) {
    return null;
  }

  const key = await importKey();
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    fromBase64Url(signaturePart),
    encoder.encode(payloadPart),
  );

  if (!valid) {
    return null;
  }

  try {
    const payload = JSON.parse(decoder.decode(fromBase64Url(payloadPart))) as SessionPayload;

    if (payload.role !== "admin" || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
