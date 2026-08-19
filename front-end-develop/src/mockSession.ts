import loggedInUser from "@/mocks/auth/loggedin-user";

const STORAGE_KEY = import.meta.env.VITE_APP_NAME || "SDID-ENROLLMENT";

function base64url(value: unknown): string {
  const json = encodeURIComponent(JSON.stringify(value)).replace(
    /%([0-9A-F]{2})/g,
    (_, hex) => String.fromCharCode(parseInt(hex, 16))
  );
  return btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function mockJWT(payload: Record<string, unknown>): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url({ alg: "HS256", typ: "JWT" });
  const body = base64url({ iat: now, exp: now + 60 * 60 * 24 * 30, ...payload });
  return `${header}.${body}.mock-signature`;
}

// Dev convenience: since the login flow and its route guards are bypassed
// locally (no real backend to authenticate against), seed a fixture session
// on first load so permission-gated screens render with data instead of
// empty/no-access states.
export function seedMockSession(): void {
  if (!import.meta.env.DEV) return;
  if (sessionStorage.getItem(STORAGE_KEY)) return;

  const account = loggedInUser.account as Record<string, any>;
  const session = {
    ...loggedInUser,
    token: mockJWT({ sub: account._id, user: account.email }),
    refreshToken: mockJWT({ sub: account._id, type: "refresh" }),
  };

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}
