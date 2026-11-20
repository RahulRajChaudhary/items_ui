/** Joins class names, skipping falsy values. Must not hold any styling decisions itself. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
