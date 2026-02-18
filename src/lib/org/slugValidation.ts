const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

const RESERVED_SLUGS = new Set([
  "api",
  "admin",
  "a",
  "access",
  "d",
  "o",
  "_next",
  "favicon.ico",
  "robots.txt",
]);

export function isValidSlugFormat(slug: string): boolean {
  return SLUG_REGEX.test(slug);
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}

export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!isValidSlugFormat(slug)) {
    return {
      valid: false,
      error:
        "Slug must be 3–50 characters, lowercase letters, numbers, and hyphens only. Cannot start or end with a hyphen.",
    };
  }
  if (isReservedSlug(slug)) {
    return { valid: false, error: "This slug is reserved." };
  }
  return { valid: true };
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}
