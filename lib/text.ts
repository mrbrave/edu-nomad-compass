// Content is returned by the official JSON API. Never render its HTML in the browser.
export function contentText(value: string): string {
  return value.replace(/\\r\\n|\\n|\\r/g, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(?:p|li|tr|div|h[1-6])>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, n: string) => {
      const c = n[0].toLowerCase() === "x" ? parseInt(n.slice(1), 16) : Number(n);
      return c > 0 && c <= 0x10ffff ? String.fromCodePoint(c) : " ";
    })
    .replace(/&(nbsp|amp|lt|gt|quot|apos);/g, (_, n: string) => ({nbsp:" ",amp:"&",lt:"<",gt:">",quot:'"',apos:"'"})[n]!)
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n/g, "\n").trim();
}
