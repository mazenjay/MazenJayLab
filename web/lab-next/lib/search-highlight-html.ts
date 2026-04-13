/**
 * 后端搜索高亮可能返回含 <mark> 的 HTML；仅保留成对 mark，其余转义，避免 XSS。
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * 将后端返回的标题/摘要安全渲染为 HTML：只保留 <mark>...</mark>，属性丢弃为纯 <mark>。
 */
export function sanitizeSearchHighlightHtml(input: string): string {
  if (!input) return "";
  let out = "";
  let i = 0;
  while (i < input.length) {
    const slice = input.slice(i);
    const openMatch = slice.match(/^<mark\b[^>]*>/i);
    if (openMatch) {
      i += openMatch[0].length;
      const rest = input.slice(i);
      const closeIdx = rest.indexOf("</mark>");
      if (closeIdx === -1) {
        out += "<mark>" + escapeHtml(rest);
        break;
      }
      const inner = rest.slice(0, closeIdx);
      i += closeIdx + "</mark>".length;
      out += "<mark>" + escapeHtml(inner) + "</mark>";
    } else {
      const nextOpen = input.indexOf("<mark", i);
      const end = nextOpen === -1 ? input.length : nextOpen;
      out += escapeHtml(input.slice(i, end));
      i = end;
    }
  }
  return out;
}

/** 读屏 / aria 用：去掉标签，粗略去空白 */
export function stripHtmlForAria(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}
