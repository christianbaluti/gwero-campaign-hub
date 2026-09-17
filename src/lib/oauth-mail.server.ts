import { randomBytes } from "node:crypto";

export type OAuthProvider = "google" | "microsoft";
const config = {
  google: {
    authorize: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    profile: "https://www.googleapis.com/oauth2/v2/userinfo",
    scopes:
      "openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly",
    clientId: "GOOGLE_OAUTH_CLIENT_ID",
    clientSecret: "GOOGLE_OAUTH_CLIENT_SECRET",
  },
  microsoft: {
    authorize: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    token: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    profile: "https://graph.microsoft.com/v1.0/me",
    scopes: "openid email profile offline_access User.Read Mail.Read Mail.Send",
    clientId: "MICROSOFT_OAUTH_CLIENT_ID",
    clientSecret: "MICROSOFT_OAUTH_CLIENT_SECRET",
  },
} as const;

function env(provider: OAuthProvider) {
  const item = config[provider];
  const clientId = process.env[item.clientId];
  const clientSecret = process.env[item.clientSecret];
  if (!clientId || !clientSecret)
    throw new Error(
      `${provider === "google" ? "Google" : "Microsoft"} OAuth is not configured on the server.`,
    );
  return { ...item, clientId, clientSecret };
}
export function beginMailOAuth(provider: OAuthProvider, request: Request) {
  const item = env(provider);
  const origin = new URL(request.url).origin;
  const state = randomBytes(24).toString("hex");
  const redirectUri = `${origin}/api/oauth/${provider}/callback`;
  const url = new URL(item.authorize);
  url.searchParams.set("client_id", item.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", item.scopes);
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  return new Response(null, {
    status: 302,
    headers: {
      location: url.toString(),
      "set-cookie": `gwero_oauth_${provider}=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${origin.startsWith("https:") ? "; Secure" : ""}`,
    },
  });
}
export async function finishMailOAuth(provider: OAuthProvider, request: Request) {
  const item = env(provider);
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookie = request.headers
    .get("cookie")
    ?.match(new RegExp(`(?:^|; )gwero_oauth_${provider}=([^;]+)`))?.[1];
  if (!code || !state || !cookie || state !== cookie)
    return redirectResult(origin, "error", "OAuth state check failed");
  const body = new URLSearchParams({
    client_id: item.clientId,
    client_secret: item.clientSecret,
    code,
    redirect_uri: `${origin}/api/oauth/${provider}/callback`,
    grant_type: "authorization_code",
  });
  const tokenResponse = await fetch(item.token, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenResponse.ok) return redirectResult(origin, "error", "Token exchange failed");
  const tokens = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
  const profileResponse = await fetch(item.profile, {
    headers: { authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileResponse.ok) return redirectResult(origin, "error", "Could not read account profile");
  const profile = (await profileResponse.json()) as {
    email?: string;
    mail?: string;
    userPrincipalName?: string;
    name?: string;
  };
  const email = profile.email || profile.mail || profile.userPrincipalName;
  if (!email)
    return redirectResult(origin, "error", "The account did not provide an email address");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const storedProvider = provider === "google" ? "gmail" : "outlook";
  const { data: mailbox, error } = await supabaseAdmin
    .from("mailboxes")
    .upsert(
      {
        name: profile.name || email,
        from_email: email,
        from_name: profile.name || null,
        provider: storedProvider,
        last_status: "Connected with OAuth",
      },
      { onConflict: "from_email" },
    )
    .select()
    .single();
  if (error || !mailbox)
    return redirectResult(origin, "error", error?.message || "Could not save mailbox");
  await supabaseAdmin.from("mailbox_secrets").upsert(
    {
      mailbox_id: mailbox.id,
      oauth_access_token: tokens.access_token,
      oauth_refresh_token: tokens.refresh_token || null,
      oauth_expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
    } as never,
    { onConflict: "mailbox_id" },
  );
  return redirectResult(origin, "connected", provider);
}
function redirectResult(origin: string, key: string, value: string) {
  return new Response(null, {
    status: 302,
    headers: {
      location: `${origin}/mailboxes?${key}=${encodeURIComponent(value)}`,
      "set-cookie":
        "gwero_oauth_google=; Path=/; HttpOnly; Max-Age=0, gwero_oauth_microsoft=; Path=/; HttpOnly; Max-Age=0",
    },
  });
}
