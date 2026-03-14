import type { Env, AuthPayload } from "./types";

export async function verifySupabaseJWT(
  request: Request,
  env: Env
): Promise<AuthPayload | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);

  try {
    const [, payloadB64] = token.split(".");
    if (!payloadB64) return null;

    // Base64url decode
    const padded = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(padded);
    const payload: AuthPayload = JSON.parse(decoded);

    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    // Check audience matches Supabase
    if (payload.aud !== "authenticated") {
      return null;
    }

    // Must have a user ID
    if (!payload.sub) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getUserId(auth: AuthPayload): string {
  return auth.sub;
}
