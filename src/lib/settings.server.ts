import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const ENV_KEYS: Record<string, string> = {
  openai_api_key: "OPENAI_API_KEY",
  google_oauth_client_id: "GOOGLE_OAUTH_CLIENT_ID",
  google_oauth_client_secret: "GOOGLE_OAUTH_CLIENT_SECRET",
  microsoft_oauth_client_id: "MICROSOFT_OAUTH_CLIENT_ID",
  microsoft_oauth_client_secret: "MICROSOFT_OAUTH_CLIENT_SECRET",
};

async function encryptionKey() {
  const configured = process.env["SETTINGS_ENCRYPTION_KEY"];
  if (configured) return createHash("sha256").update(configured).digest();
  if (process.env["NODE_ENV"] === "production")
    throw new Error("SETTINGS_ENCRYPTION_KEY is required in production.");
  const path = resolve(process.cwd(), "var/settings.key");
  try {
    return createHash("sha256")
      .update(await readFile(path))
      .digest();
  } catch {
    const value = randomBytes(48);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, value, { mode: 0o600 });
    return createHash("sha256").update(value).digest();
  }
}

async function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", await encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [
    "v1",
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

async function decrypt(value: string) {
  const [version, iv, tag, data] = value.split(":");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Invalid encrypted setting.");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    await encryptionKey(),
    Buffer.from(iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString(
    "utf8",
  );
}

export async function getSecret(key: string) {
  const envName = ENV_KEYS[key];
  if (envName && process.env[envName]) return process.env[envName]!;
  const { serverDb } = await import("./db.server");
  const { data } = await serverDb
    .from("app_secrets")
    .select("*")
    .eq("secret_key", key)
    .maybeSingle();
  return data?.encrypted_value ? decrypt(data.encrypted_value) : null;
}

export async function setSecret(key: string, value: string) {
  if (!value.trim()) return;
  const { serverDb } = await import("./db.server");
  const { error } = await serverDb.from("app_secrets").upsert(
    {
      secret_key: key,
      encrypted_value: await encrypt(value.trim()),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "secret_key" },
  );
  if (error) throw new Error(error.message);
}

export async function hasSecret(key: string) {
  return Boolean(await getSecret(key));
}
