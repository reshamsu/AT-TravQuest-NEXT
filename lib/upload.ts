// Client-side helper for /api/upload, which hands back a presigned R2 PUT
// URL (edge runtime can't buffer large multipart bodies) rather than
// accepting the file itself. Every dashboard upload button goes through
// this two-step flow: ask for a signed URL, then PUT the file straight to
// R2 with it.
export async function uploadImage(file: File, folder: string): Promise<string> {
  const signRes = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type, folder }),
  });
  const signData = await signRes.json().catch(() => ({})) as { signedUrl?: string; publicUrl?: string; error?: string };
  if (!signRes.ok || !signData.signedUrl || !signData.publicUrl) {
    throw new Error(signData.error ?? "Failed to get upload URL");
  }

  const putRes = await fetch(signData.signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!putRes.ok) throw new Error("Upload to storage failed");

  return signData.publicUrl;
}
