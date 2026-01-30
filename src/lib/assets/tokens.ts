import crypto from "crypto";

// Public token used in QR codes. Must be unguessable.

export function generatePublicToken(bytes = 16): string {
  return crypto.randomBytes(bytes).toString("base64url");
}
