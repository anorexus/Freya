const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive.file",
].join(" ");

const SESSION_KEY = "freya.google.session";

export type GoogleSession = {
  accessToken: string;
  expiresAt: number;
  email: string;
  name: string;
};

export function readSession(): GoogleSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as GoogleSession;
    if (!session.accessToken || session.expiresAt <= Date.now()) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export async function signInWithGoogle(prompt: "select_account" | "consent" = "select_account"): Promise<GoogleSession> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("Missing Google client ID.");
  const token = await requestToken(clientId, prompt);
  const profile = await fetchProfile(token.accessToken);
  const session: GoogleSession = {
    accessToken: token.accessToken,
    expiresAt: token.expiresAt,
    email: profile.email,
    name: profile.name,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function tokenIncludesDriveFile(accessToken: string): Promise<boolean> {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
  if (!response.ok) return false;
  const body = (await response.json()) as { scope?: string };
  return (body.scope ?? "").split(" ").includes("https://www.googleapis.com/auth/drive.file");
}

async function requestToken(clientId: string, prompt: "select_account" | "consent"): Promise<{ accessToken: string; expiresAt: number }> {
  await loadGis();
  const google = window.google;
  if (!google) throw new Error("Google sign-in failed to load.");

  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description || response.error || "Google did not return a token."));
          return;
        }
        const expiresIn = response.expires_in ?? 3600;
        resolve({
          accessToken: response.access_token,
          expiresAt: Date.now() + expiresIn * 1000 - 60_000,
        });
      },
      error_callback: (error) => {
        if (error.type === "popup_closed") {
          reject(new Error("Sign-in was cancelled."));
          return;
        }
        if (error.type === "popup_failed_to_open" || error.message === "Failed to open popup window") {
          reject(new Error("The Google window was blocked. Allow popups for localhost, then try Sign in again."));
          return;
        }
        reject(new Error(error.message || "Google sign-in was blocked. Check that http://localhost:5173 is an authorized origin."));
      },
    });
    client.requestAccessToken({ prompt });
  });
}

async function fetchProfile(accessToken: string): Promise<{ email: string; name: string }> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return { email: "Google account", name: "" };
  const profile = (await response.json()) as { email?: string; name?: string };
  return { email: profile.email || "Google account", name: profile.name || "" };
}

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-fy-gis]");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google sign-in failed to load.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.dataset.fyGis = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google sign-in failed to load."));
    document.head.appendChild(script);
  });
}
