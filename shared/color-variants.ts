import type { Product } from "./schema.js";

export interface ProductColorVariant {
  name: string;
  swatch: string;
  images: string[];
}

export type ProductWithColorVariants = Product & {
  colorVariants?: ProductColorVariant[];
};

export const PRODUCT_COLOR_VARIANTS_PREFIX = "productColorVariants:";

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

export function getProductColorVariantsSettingKey(productId: number): string {
  return `${PRODUCT_COLOR_VARIANTS_PREFIX}${productId}`;
}

export function parseProductColorVariantsSettingKey(key: string): number | null {
  if (!key.startsWith(PRODUCT_COLOR_VARIANTS_PREFIX)) {
    return null;
  }
  const rawId = key.slice(PRODUCT_COLOR_VARIANTS_PREFIX.length);
  const productId = Number.parseInt(rawId, 10);
  if (!Number.isInteger(productId) || productId <= 0) {
    return null;
  }
  return productId;
}

function normalizeSwatch(swatch: string): string {
  const trimmed = swatch.trim();
  if (!trimmed) {
    return "#272c40";
  }
  return HEX_COLOR_REGEX.test(trimmed) ? trimmed : "#272c40";
}

export function sanitizeProductColorVariants(input: unknown): ProductColorVariant[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const sanitized: ProductColorVariant[] = [];
  for (const rawVariant of input) {
    if (!rawVariant || typeof rawVariant !== "object") {
      continue;
    }

    const variant = rawVariant as Record<string, unknown>;
    const name = typeof variant.name === "string" ? variant.name.trim() : "";
    const swatch = typeof variant.swatch === "string" ? normalizeSwatch(variant.swatch) : "#272c40";
    const images = Array.isArray(variant.images)
      ? variant.images
          .filter((image): image is string => typeof image === "string")
          .map((image) => image.trim())
          .filter(Boolean)
      : [];

    if (!name || images.length === 0) {
      continue;
    }

    sanitized.push({ name, swatch, images });
  }

  return sanitized;
}

export function parseProductColorVariants(rawValue?: string | null): ProductColorVariant[] {
  if (!rawValue || rawValue.trim().length === 0) {
    return [];
  }
  try {
    const parsed = JSON.parse(rawValue);
    return sanitizeProductColorVariants(parsed);
  } catch {
    return [];
  }
}
