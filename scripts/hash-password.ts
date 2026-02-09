import { hashPassword } from "../src/lib/auth/passwords";

const input = process.argv[2];

if (!input) {
  console.error("Usage: npx tsx scripts/hash-password.ts <password>");
  process.exit(1);
}

hashPassword(input).then((hash) => {
  console.log(hash);
});
