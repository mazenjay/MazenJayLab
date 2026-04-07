/**
 * 文章详情 URL。Lab 与 Go 分端口开发时（例 :3000 / :8080）请设置 `NEXT_PUBLIC_ARTICLE_ORIGIN`
 * 为 Go 用户站 origin，否则 `/${slug}` 会打到 Next 且一般无对应页面。
 */
export function articleHref(slug: string): string {
  const origin =
    process.env.NEXT_PUBLIC_ARTICLE_ORIGIN?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "");
  if (origin) return `${origin}/${encodeURIComponent(slug)}`;
  return `/${encodeURIComponent(slug)}`;
}
