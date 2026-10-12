/**
 * Normalizes and parses a date string into a Date object.
 * Handles:
 * - ISO-8601 strings with timezone indicators (e.g. "2026-10-12T14:22:45Z" or "+05:30")
 * - SQLite CURRENT_TIMESTAMP strings (e.g. "2026-10-12 14:22:45"), which are stored in UTC
 *   without timezone offset and must be treated as UTC.
 */
export function parseUtcDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // If no timezone is specified (e.g., SQLite "YYYY-MM-DD HH:MM:SS"), append 'Z' so it is parsed as UTC
  const normalized =
    trimmed.includes("Z") || /[+-]\d{2}(:\d{2})?$/.test(trimmed)
      ? trimmed
      : `${trimmed.replace(" ", "T")}Z`;

  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDateTime(
  iso: string | null | undefined,
  includeSeconds: boolean = true
): string {
  const d = parseUtcDate(iso);
  if (!d) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...(includeSeconds ? { second: "2-digit" } : {}),
    hour12: false,
  });
}

export function formatDate(iso: string | null | undefined): string {
  const d = parseUtcDate(iso);
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

