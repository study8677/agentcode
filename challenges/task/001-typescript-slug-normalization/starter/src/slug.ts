export function normalizeSlug(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, "-");
}
