/**
 * Converts a base64 string to a Blob object.
 */
export function base64ToBlob(
  base64: string,
  contentType = "application/octet-stream"
): Blob {
  const byteCharacters = atob(base64.split(",")[1] || base64);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type: contentType });
}

/**
 * Tries to guess a filename from a base64 string or fallback.
 */
export function guessName(data: string, fallback = "upload.bin"): string {
  // Handle base64 data URIs
  const match = data.match(/^data:(.*?);base64,/);
  if (match) {
    const mimeType = match[1];
    if (mimeType) {
      const ext = mimeType.split("/")[1];
      console.log("ext", ext);
      return `upload.${ext}`;
    }
  }

  // Handle raw data - detect file type from magic numbers
  return detectFileTypeFromData(data, fallback);
}

function detectFileTypeFromData(data: string, fallback: string): string {
  // Try to decode as base64 first
  let binaryData: Uint8Array;
  try {
    const cleanData = data.replace(/\s/g, ""); // Remove whitespace
    binaryData = Uint8Array.from(atob(cleanData), (c) => c.charCodeAt(0));
  } catch (e) {
    // If not valid base64, try to create from string directly
    binaryData = new TextEncoder().encode(data.substring(0, 64));
  }

  // Check magic numbers for various file formats
  const signature = Array.from(binaryData.slice(0, 16))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

  const header = Array.from(binaryData.slice(0, 8))
    .map((b) => String.fromCharCode(b))
    .join("");

  // JPEG 2000 - JP2 format
  if (
    signature.startsWith("0000000C6A502020") || // JP2 signature
    data.startsWith("AAAADGpQICANCocKAAAAFGZ0eXBqcDIg") ||
    header.includes("jp2")
  ) {
    return "upload.jp2";
  }

  // JPEG
  if (signature.startsWith("FFD8FF") || data.startsWith("/9j/")) {
    return "upload.jpg";
  }

  // PNG
  if (
    signature.startsWith("89504E470D0A1A0A") ||
    data.startsWith("iVBORw0KGgo")
  ) {
    return "upload.png";
  }

  // GIF
  if (signature.startsWith("47494638") || data.startsWith("R0lGODlh")) {
    return "upload.gif";
  }

  // BMP
  if (signature.startsWith("424D")) {
    return "upload.bmp";
  }

  // WebP
  if (
    signature.startsWith("52494646") &&
    Array.from(binaryData.slice(8, 12))
      .map((b) => String.fromCharCode(b))
      .join("") === "WEBP"
  ) {
    return "upload.webp";
  }

  // TIFF
  if (signature.startsWith("49492A00") || signature.startsWith("4D4D002A")) {
    return "upload.tiff";
  }

  return fallback;
}
