import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Context, Next } from "hono";
import type { Env } from "./env";
import { randomId, randomToken } from "./crypto";

const SESSION_COOKIE = "rssf_session";
const OAUTH_STATE_COOKIE = "rssf_oauth_state";
const SESSION_DAYS = 14;

export type AuthedUser = {
  id: string;
  email: string;
  name: string;
  picture: string;
};

type AppVars = { user: AuthedUser };

export type AppEnv = {
  Bindings: Env;
  Variables: AppVars;
};

function sessionExpiryIso(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + SESSION_DAYS);
  return d.toISOString();
}

function isSecure(c: Context<AppEnv>): boolean {
  return new URL(c.req.url).protocol === "https:";
}

export async function getSessionUser(
  c: Context<AppEnv>,
): Promise<AuthedUser | null> {
  const sessionId = getCookie(c, SESSION_COOKIE);
  if (!sessionId) return null;

  const row = await c.env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.picture
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > datetime('now')`,
  )
    .bind(sessionId)
    .first<{ id: string; email: string; name: string; picture: string }>();

  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    picture: row.picture,
  };
}

export async function requireAuth(c: Context<AppEnv>, next: Next) {
  const user = await getSessionUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("user", user);
  await next();
}

export function startGoogleLogin(c: Context<AppEnv>) {
  const clientId = c.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return c.json({ error: "GOOGLE_CLIENT_ID is not configured" }, 500);
  }

  const state = randomToken(24);
  setCookie(c, OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: isSecure(c),
    sameSite: "Lax",
    path: "/",
    maxAge: 600,
  });

  const redirectUri = new URL("/auth/callback", c.req.url).toString();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  return c.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
}

export async function handleGoogleCallback(c: Context<AppEnv>) {
  const url = new URL(c.req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const expectedState = getCookie(c, OAUTH_STATE_COOKIE);

  deleteCookie(c, OAUTH_STATE_COOKIE, { path: "/" });

  if (error) {
    return c.redirect(`/?error=${encodeURIComponent(error)}`);
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    return c.redirect("/?error=invalid_oauth_state");
  }

  const clientId = c.env.GOOGLE_CLIENT_ID;
  const clientSecret = c.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return c.redirect("/?error=oauth_not_configured");
  }

  const redirectUri = new URL("/auth/callback", c.req.url).toString();
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return c.redirect("/?error=token_exchange_failed");
  }

  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) {
    return c.redirect("/?error=token_exchange_failed");
  }

  const profileRes = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    { headers: { Authorization: `Bearer ${tokens.access_token}` } },
  );
  if (!profileRes.ok) {
    return c.redirect("/?error=profile_fetch_failed");
  }

  const profile = (await profileRes.json()) as {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
  };

  if (!profile.sub || !profile.email) {
    return c.redirect("/?error=profile_incomplete");
  }

  const existing = await c.env.DB.prepare(
    "SELECT id FROM users WHERE google_sub = ?",
  )
    .bind(profile.sub)
    .first<{ id: string }>();

  const userId = existing?.id ?? randomId(16);
  const name = profile.name ?? "";
  const picture = profile.picture ?? "";

  if (existing) {
    await c.env.DB.prepare(
      `UPDATE users
       SET email = ?, name = ?, picture = ?, updated_at = datetime('now')
       WHERE id = ?`,
    )
      .bind(profile.email, name, picture, userId)
      .run();
  } else {
    await c.env.DB.prepare(
      `INSERT INTO users (id, google_sub, email, name, picture)
       VALUES (?, ?, ?, ?, ?)`,
    )
      .bind(userId, profile.sub, profile.email, name, picture)
      .run();
  }

  const sessionId = randomToken(32);
  await c.env.DB.prepare(
    `INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)`,
  )
    .bind(sessionId, userId, sessionExpiryIso())
    .run();

  setCookie(c, SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: isSecure(c),
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });

  return c.redirect("/app");
}

export async function logout(c: Context<AppEnv>) {
  const sessionId = getCookie(c, SESSION_COOKIE);
  if (sessionId) {
    await c.env.DB.prepare("DELETE FROM sessions WHERE id = ?")
      .bind(sessionId)
      .run();
  }
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.json({ ok: true });
}
