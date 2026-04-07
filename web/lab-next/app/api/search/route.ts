import { NextRequest, NextResponse } from "next/server";
import { searchMock } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const backend = process.env.BACKEND_URL?.replace(/\/$/, "");
  const command = request.nextUrl.searchParams.get("command") || "";
  const keywords = request.nextUrl.searchParams.get("keywords") || "";
  const page = Number(request.nextUrl.searchParams.get("page") || "1");
  const perPage = Number(request.nextUrl.searchParams.get("per_page") || "10");

  if (backend) {
    try {
      const url = new URL(`${backend}/api/search`);
      url.searchParams.set("command", command);
      url.searchParams.set("keywords", keywords);
      url.searchParams.set("page", String(page));
      url.searchParams.set("per_page", String(perPage));
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch {
      return NextResponse.json(searchMock(keywords, command, page, perPage));
    }
  }

  return NextResponse.json(searchMock(keywords, command, page, perPage));
}
