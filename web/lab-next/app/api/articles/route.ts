import { NextRequest, NextResponse } from "next/server";
import { normalizeArticlesPayload } from "@/lib/articles-payload";
import { ARTICLES_PAGE_SIZE } from "@/lib/constants";
import { paginateArticles } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const backend = process.env.BACKEND_URL?.replace(/\/$/, "");
  const { searchParams } = request.nextUrl;

  if (backend) {
    try {
      const url = new URL(`${backend}/api/articles`);
      searchParams.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
      const res = await fetch(url.toString(), {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const text = await res.text();
      let data: unknown = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        return NextResponse.json(normalizeArticlesPayload(null), { status: 502 });
      }
      const payload = normalizeArticlesPayload(data);
      return NextResponse.json(payload, { status: res.ok ? 200 : res.status });
    } catch {
      const page = Number(searchParams.get("page") || "1");
      return NextResponse.json(paginateArticles(page, ARTICLES_PAGE_SIZE));
    }
  }

  const page = Number(searchParams.get("page") || "1");
  return NextResponse.json(paginateArticles(page, ARTICLES_PAGE_SIZE));
}
