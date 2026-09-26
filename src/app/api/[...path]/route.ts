import type { NextRequest } from "next/server";

// Прокси /api/* → Go-сервер каталога. Браузер ходит только на Next.js,
// поэтому планшетам нужен один адрес и не нужен CORS. Адрес API читается
// при каждом запросе, а не при сборке: один образ подходит для любого окружения.
export async function GET(req: NextRequest, ctx: RouteContext<"/api/[...path]">) {
  const { path } = await ctx.params;
  const base = process.env.CATALOG_API_URL ?? "http://localhost:8080";
  const target = `${base}/api/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`;
  try {
    const res = await fetch(target, { cache: "no-store", signal: req.signal });
    return new Response(res.body, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch (err) {
    if (req.signal.aborted) return new Response(null, { status: 499 });
    console.error("catalog api unavailable:", target, err);
    return Response.json({ error: "catalog api unavailable" }, { status: 502 });
  }
}
