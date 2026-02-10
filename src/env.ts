import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32),

  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),

  PUBLIC_BASE_URL: z.string().url(),

  // S3 bucket naming rules are stricter in reality; this is a good MVP guardrail.
  AWS_S3_BUCKET: z
    .string()
    .min(3)
    .max(63)
    .regex(/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/, "Invalid S3 bucket name"),
});

export const env = envSchema.parse(process.env);

