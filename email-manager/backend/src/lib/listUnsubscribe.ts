import { ParsedListUnsubscribe } from "../types";

/**
 * Parses the List-Unsubscribe header (RFC 2369) and, when present, the
 * List-Unsubscribe-Post header (RFC 8058) that marks a link as safe for a
 * true one-click POST unsubscribe (no confirmation page, no extra clicks).
 *
 * Example header:
 *   List-Unsubscribe: <mailto:unsub@list.com?subject=unsubscribe>, <https://list.com/u/123>
 *   List-Unsubscribe-Post: List-Unsubscribe=One-Click
 */
export function parseListUnsubscribe(
  headerValue: string | undefined | null,
  postHeaderValue: string | undefined | null
): ParsedListUnsubscribe {
  const result: ParsedListUnsubscribe = { mailto: null, http: null, oneClick: false };
  if (!headerValue) return result;

  const targets = [...headerValue.matchAll(/<([^>]+)>/g)].map((m) => m[1].trim());

  for (const target of targets) {
    if (/^mailto:/i.test(target) && !result.mailto) {
      result.mailto = target;
    } else if (/^https?:/i.test(target) && !result.http) {
      result.http = target;
    }
  }

  result.oneClick = Boolean(
    result.http && postHeaderValue && /one-click/i.test(postHeaderValue)
  );

  return result;
}

/**
 * Best-effort fallback for newsletters that omit the List-Unsubscribe
 * header entirely: scans the HTML body for an anchor whose visible text or
 * href hints at an unsubscribe / preferences link.
 */
export function findUnsubscribeLinkInHtml(html: string | undefined | null): string | null {
  if (!html) return null;

  const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const hintPattern =
    /unsubscribe|opt[\s-]?out|email[\s-]?preferences|manage[\s-]?(your[\s-]?)?subscription/i;

  let match: RegExpExecArray | null;
  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1];
    const text = match[2].replace(/<[^>]+>/g, " ");
    if (hintPattern.test(text) || hintPattern.test(href)) {
      return href;
    }
  }
  return null;
}
