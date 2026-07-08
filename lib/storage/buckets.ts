// All images and media are stored in Cloudflare R2.
// The public URL is stored as a string in Supabase table columns (e.g. image_url).
// Upload flow:
//   1. Client requests a presigned URL → /travel/api/upload-image
//   2. Client PUTs the file directly to R2
//   3. Client saves the returned publicUrl into the Supabase table

// Build a public R2 URL from a storage key
export function r2Url(key: string): string {
  const base = (process.env.R2_PUBLIC_BUCKET_URL ?? "").replace(/\/$/, "");
  return `${base}/${key}`;
}

// R2 folder conventions used across the codebase
export const R2_FOLDERS = {
  HERO_IMAGES: "hero/images",
  HERO_VIDEOS: "hero/videos",
  DESTINATIONS: "destinations",
  PACKAGES: "packages",
  EXPERIENCES: "experiences",
  TOURS: "tours",
  HOTELS: "hotels",
} as const;
