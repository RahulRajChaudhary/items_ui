import { NextResponse } from "next/server";
import { createMockDb, handleMock, type MockDb } from "@/modules/items/mocks/handler";

/** Dev-only mock backend for the Items module (same paths and envelopes as the real API). Stays in memory per server run. */
const g = globalThis as unknown as { __itemsMockDbV3?: MockDb };
const db = (g.__itemsMockDbV3 ??= createMockDb());

async function handle(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const url = new URL(req.url);
  let body: unknown;
  if (req.method === "PUT" || req.method === "POST") {
    const form = new URLSearchParams(await req.text());
    const raw = form.get("JSONString");
    try {
      body = raw ? JSON.parse(raw) : undefined;
    } catch {
      return NextResponse.json({ code: 2, message: "Invalid value passed for JSONString" }, { status: 400 });
    }
    if (form.get("organization_id")) url.searchParams.set("organization_id", form.get("organization_id") ?? "");
  }
  const res = handleMock(db, req.method, `/${path.join("/")}`, url.searchParams, body);
  return NextResponse.json(res.body, { status: res.status });
}

export { handle as GET, handle as PUT, handle as POST, handle as DELETE };
