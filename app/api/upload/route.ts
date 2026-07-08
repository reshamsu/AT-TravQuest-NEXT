export const runtime = "edge";

import { AwsV4Signer } from "aws4fetch";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (
    !process.env.R2_ACCOUNT_ID ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY ||
    !process.env.R2_PUBLIC_BUCKET
  ) {
    return NextResponse.json({ error: "Missing R2 env vars" }, { status: 500 });
  }

  try {
    const { filename, contentType, folder } = await req.json();
    const key = `${folder}/${Date.now()}_${filename}`;

    const endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const url = new URL(`${endpoint}/${process.env.R2_PUBLIC_BUCKET}/${key}`);
    url.searchParams.set("X-Amz-Expires", "60");

    const signer = new AwsV4Signer({
      url: url.toString(),
      method: "PUT",
      region: "auto",
      service: "s3",
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      headers: new Headers({ "Content-Type": contentType }),
      signQuery: true,
    });

    const signed = await signer.sign();
    const signedUrl = signed.url.toString();
    const publicUrl = `${process.env.R2_PUBLIC_BUCKET_URL}/${key}`;

    return NextResponse.json({ signedUrl, publicUrl });
  } catch (err) {
    console.error("R2 signed URL error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
