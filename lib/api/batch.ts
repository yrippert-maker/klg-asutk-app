import { NextResponse } from "next/server";
export async function POST(request: Request) {
  return NextResponse.json({ error: "Batch API not implemented" }, { status: 501 });
}
