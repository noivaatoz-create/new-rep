export const HOME_GALLERY_SETTINGS_KEY = "homeGalleryImages";

export const DEFAULT_HOME_GALLERY_IMAGES = [
  "/gallery/ezgif-frame-001_1770676967743.jpg",
  "/gallery/gallery-021.png",
  "/gallery/gallery-042.png",
  "/gallery/gallery-023.png",
  "/gallery/gallery-043.png",
  "/gallery/ezgif-frame-015_1770676967744.jpg",
  "/gallery/gallery-044.png",
  "/gallery/gallery-026.png",
  "/gallery/gallery-045.png",
  "/gallery/gallery-034.png",
  "/gallery/gallery-022.png",
  "/gallery/gallery-028.png",
  "/gallery/gallery-041.png",
  "/gallery/ezgif-frame-020_1770676967744.jpg",
  "/gallery/gallery-046.png",
  "/gallery/gallery-024.png",
  "/gallery/gallery-033.png",
  "/gallery/gallery-047.png",
  "/gallery/gallery-038.png",
  "/gallery/gallery-040.png",
];

export function parseHomeGalleryImages(rawValue?: string | null): string[] {
  if (!rawValue || rawValue.trim().length === 0) {
    return [...DEFAULT_HOME_GALLERY_IMAGES];
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) {
      const cleaned = parsed
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter(Boolean);
      if (cleaned.length > 0) {
        return cleaned;
      }
    }
  } catch {
    const cleaned = rawValue
      .split(/\r?\n|,/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (cleaned.length > 0) {
      return cleaned;
    }
  }

  return [...DEFAULT_HOME_GALLERY_IMAGES];
}
