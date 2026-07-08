import { NextRequest, NextResponse } from "next/server";

// The R2 bucket serving listing images sends no Access-Control-Allow-Origin
// header, so a browser-side `fetch(url, { mode: "cors" })` (used by
// lib/exportPromotionPDF.ts to draw photos onto the flyer canvas) is always
// rejected and silently falls back to a placeholder gradient — every
// generated PDF was missing real photos. Proxying the fetch through our own
// origin (Node, no CORS restriction) fixes it without touching R2 config.

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  // Match any R2 public dev domain, not just the current R2_PUBLIC_BUCKET_URL —
  // existing rows can point at a previous bucket URL after a rename/migration,
  // and this proxy shouldn't break for content uploaded before the change.
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }
  if (!host.endsWith(".r2.dev")) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  const res = await fetch(url);
  if (!res.ok) return NextResponse.json({ error: "Fetch failed" }, { status: 502 });

  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  const body = await res.arrayBuffer();
  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
