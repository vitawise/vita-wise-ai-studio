/** URL-safe slug from a (possibly Arabic) name; always unique via a random suffix. */
export function pharmacySlug(name: string, random: () => string = randomSuffix): string {
  const base = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "pharmacy"}-${random()}`;
}

function randomSuffix(): string {
  return crypto.randomUUID().slice(0, 6);
}
