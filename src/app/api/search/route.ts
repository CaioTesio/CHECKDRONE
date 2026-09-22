import { NextResponse } from "next/server";
import { globalSearch } from "@/server/search";

export async function GET(request: Request) {
  const term = new URL(request.url).searchParams.get("q") ?? "";
  const results = await globalSearch(term, 5);

  return NextResponse.json(results, {
    headers: { "Cache-Control": "no-store" },
  });
}
