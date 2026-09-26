import type { NextRequest } from "next/server";

// Прокси /api/* → Go-сервер каталога. Браузер ходит только на Next.js,
// поэтому планшетам нужен один адрес и не нужен CORS. Адрес API читается
// при каждом запросе, а не при сборке: один образ подходит для любого окружения.

type Ctx = RouteContext<"/api/[...path]">;

async function target(req: NextRequest, ctx: Ctx): Promise<string> {
  const { path } = await ctx.params;
  const base = process.env.CATALOG_API_URL ?? "http://localhost:8080";
  return `${base}/api/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`;
}

async function forward(req: NextRequest, url: string, init: RequestInit): Promise<Response> {
  try {
    const res = await fetch(url, { cache: "no-store", signal: req.signal, ...init });
    return new Response(res.body, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch (err) {
    if (req.signal.aborted) return new Response(null, { status: 499 });
    console.error("catalog api unavailable:", url, err);
    return Response.json({ error: "catalog api unavailable" }, { status: 502 });
  }
}

export async function GET(req: NextRequest, ctx: Ctx) {
  return forward(req, await target(req, ctx), {});
}

// POST пропускаем только для импорта каталога от encore-sync (порт API наружу
// не открыт). Тело (gzip JSON) и токен передаются как есть, проверяет их API.
export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  if (path.join("/") !== "import") {
    return Response.json({ error: "method not allowed" }, { status: 405 });
  }
  const headers = new Headers();
  for (const name of ["authorization", "content-type", "content-encoding", "user-agent"]) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }
  return forward(req, await target(req, ctx), {
    method: "POST",
    headers,
    body: req.body,
    // Потоковая передача тела в fetch (Node.js) требует duplex: "half".
    duplex: "half",
  } as RequestInit);
}
