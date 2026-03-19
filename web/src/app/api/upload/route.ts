import { NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];
const ALLOWED_DOC_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  "image/gif",
  "application/pdf",
];

const THUMBNAIL_SIZE = 400;

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null; // "photo" or "document"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 400 },
      );
    }

    const allowedTypes =
      type === "photo" ? ALLOWED_IMAGE_TYPES : ALLOWED_DOC_TYPES;

    // Normalize HEIC/HEIF — some clients send slightly different MIME strings
    const normalizedMime = normalizeHeic(file.type);
    if (!allowedTypes.includes(normalizedMime)) {
      return NextResponse.json(
        { error: `File type ${file.type} not allowed` },
        { status: 400 },
      );
    }

    const subDir = type === "photo" ? "photos" : "documents";
    const dirPath = path.join(UPLOAD_DIR, subDir);
    await mkdir(dirPath, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());

    if (type === "photo") {
      // For photos: convert HEIC→JPEG if needed, then save original + thumbnail
      const sharp = (await import("sharp")).default;

      const isHeic =
        normalizedMime === "image/heic" || normalizedMime === "image/heif";

      // Convert HEIC to JPEG; for others, just re-encode with sharp (normalizes format)
      const outputExt = ".jpg";
      const uniqueBase = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
      const fileName = `${uniqueBase}${outputExt}`;
      const thumbName = `thumb_${uniqueBase}${outputExt}`;

      const filePath = path.join(dirPath, fileName);
      const thumbPath = path.join(dirPath, thumbName);

      // Process: convert HEIC or just pass through, output JPEG
      const processedBuffer = await sharp(buffer)
        .rotate() // honour EXIF orientation
        .jpeg({ quality: 85 })
        .toBuffer();

      // Thumbnail: 400px max dimension
      const thumbBuffer = await sharp(buffer)
        .rotate()
        .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      await writeFile(filePath, processedBuffer);
      await writeFile(thumbPath, thumbBuffer);

      return NextResponse.json({
        file_path: `${subDir}/${fileName}`,
        thumb_path: `${subDir}/${thumbName}`,
        original_name: isHeic
          ? file.name.replace(/\.heic$/i, ".jpg").replace(/\.heif$/i, ".jpg")
          : file.name,
        file_size: processedBuffer.length,
        mime_type: "image/jpeg",
      });
    } else {
      // Documents: save as-is
      const ext = path.extname(file.name) || mimeToExt(normalizedMime);
      const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
      const filePath = path.join(dirPath, uniqueName);
      await writeFile(filePath, buffer);

      return NextResponse.json({
        file_path: `${subDir}/${uniqueName}`,
        original_name: file.name,
        file_size: file.size,
        mime_type: normalizedMime,
      });
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 },
    );
  }
}

function normalizeHeic(mime: string): string {
  if (mime === "image/heic" || mime === "image/heif") return mime;
  // Some iOS devices send these variants
  if (mime === "image/heic-sequence" || mime === "image/heif-sequence") return "image/heic";
  return mime;
}

function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/heic": ".jpg",
    "image/heif": ".jpg",
    "application/pdf": ".pdf",
  };
  return map[mime] || "";
}
