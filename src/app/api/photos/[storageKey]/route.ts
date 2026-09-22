import { type NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const STORAGE_DIR = path.join(process.cwd(), ".photos");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storageKey: string }> },
) {
  try {
    const { storageKey } = await params;

    // Prevent path traversal
    if (storageKey.includes("..") || storageKey.includes("/")) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const filePath = path.join(STORAGE_DIR, storageKey);

    // Verify file exists and is within storage directory
    const realPath = await fs.realpath(filePath).catch(() => null);
    const realStorageDir = await fs.realpath(STORAGE_DIR);

    if (!realPath || !realPath.startsWith(realStorageDir)) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const file = await fs.readFile(filePath);

    // Determine MIME type from extension
    const ext = path.extname(storageKey).toLowerCase();
    const mimeType =
      ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".png"
          ? "image/png"
          : ext === ".webp"
            ? "image/webp"
            : "application/octet-stream";

    return new NextResponse(file, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[photo-api]", error);
    return new NextResponse("Not Found", { status: 404 });
  }
}
