import crypto from "crypto";

//Returns a URL-safe random session token.
export function generateSessionToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

//Hash tokens before storing/looking up in DB.
export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

