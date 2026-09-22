import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { globalSearch } from "@/server/search";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const term = new URL(request.url).searchParams.get("q") ?? "";
  const results = await globalSearch(term, 5);

  return NextResponse.json(results, {
    headers: { "Cache-Control": "no-store" },
  });
}
