import crypto from "crypto";

const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = 16384; // N
const SCRYPT_BLOCK_SIZE = 8; // r
const SCRYPT_PARALLELIZATION = 1; // p
const SALT_BYTES = 16;

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: crypto.ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_BYTES);
  const derived = await scryptAsync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
  });

  return `scrypt:N=${SCRYPT_COST},r=${SCRYPT_BLOCK_SIZE},p=${SCRYPT_PARALLELIZATION}:${salt.toString("base64")}:${derived.toString("base64")}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;

  const params = parts[1].split(",");
  const N = Number(params.find((p) => p.startsWith("N="))?.slice(2));
  const r = Number(params.find((p) => p.startsWith("r="))?.slice(2));
  const p = Number(params.find((p) => p.startsWith("p="))?.slice(2));

  if (!N || !r || !p) return false;

  const salt = Buffer.from(parts[2], "base64");
  const expectedKey = Buffer.from(parts[3], "base64");

  const derived = await scryptAsync(password, salt, expectedKey.length, {
    N,
    r,
    p,
  });

  return crypto.timingSafeEqual(derived, expectedKey);
}
