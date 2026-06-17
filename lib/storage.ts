import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";

const s3 = new S3Client({
  region: process.env.AWS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;

function s3Url(key: string): string {
  return `${process.env.AWS_CLOUDFRONT_URL!}/${key}`;
}

function isSunoUrl(url: string): boolean {
  return (
    url.includes("tempfile.aiquickdraw.com") ||
    url.includes("removeai.ai") ||
    url.includes("suno")
  );
}

async function downloadBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return s3Url(key);
}

export async function persistSongMedia(
  songId: string,
  userId: string,
  audioUrl: string | null,
  audioUrl2: string | null,
  imageUrl: string | null,
): Promise<void> {
  const updates: Record<string, string> = {};

  console.log(`[storage] Starting persist for song ${songId} (user ${userId})`);
  console.log(`[storage] Suno URLs — v1: ${audioUrl} | v2: ${audioUrl2} | img: ${imageUrl}`);

  try {
    if (audioUrl && isSunoUrl(audioUrl)) {
      console.log(`[storage] Downloading v1...`);
      const buf = await downloadBuffer(audioUrl);
      console.log(`[storage] Downloaded v1 (${(buf.length / 1024 / 1024).toFixed(1)}MB), uploading to S3...`);
      updates.audioUrl = await uploadToS3(
        `songs/${userId}/${songId}/v1.mp3`,
        buf,
        "audio/mpeg",
      );
      console.log(`[storage] v1 uploaded → ${updates.audioUrl}`);
    }

    if (audioUrl2 && isSunoUrl(audioUrl2)) {
      console.log(`[storage] Downloading v2...`);
      const buf = await downloadBuffer(audioUrl2);
      console.log(`[storage] Downloaded v2 (${(buf.length / 1024 / 1024).toFixed(1)}MB), uploading to S3...`);
      updates.audioUrl2 = await uploadToS3(
        `songs/${userId}/${songId}/v2.mp3`,
        buf,
        "audio/mpeg",
      );
      console.log(`[storage] v2 uploaded → ${updates.audioUrl2}`);
    }

    if (imageUrl && isSunoUrl(imageUrl)) {
      const ext = imageUrl.includes(".png") ? "png" : "jpeg";
      console.log(`[storage] Downloading cover...`);
      const buf = await downloadBuffer(imageUrl);
      console.log(`[storage] Downloaded cover (${(buf.length / 1024).toFixed(0)}KB), uploading to S3...`);
      updates.imageUrl = await uploadToS3(
        `songs/${userId}/${songId}/cover.${ext}`,
        buf,
        `image/${ext}`,
      );
      console.log(`[storage] cover uploaded → ${updates.imageUrl}`);
    }

    if (Object.keys(updates).length > 0) {
      await db.song.update({ where: { id: songId }, data: updates });
      console.log(`[storage] DB updated for song ${songId}:`, Object.keys(updates));
    } else {
      console.log(`[storage] No Suno URLs to persist for song ${songId}`);
    }
  } catch (err) {
    console.error(`[storage] Failed to persist media for song ${songId}:`, err);
  }
}
