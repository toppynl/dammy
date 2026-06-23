import React from "react";
import { getDamOrigin } from "./index";

/**
 * `dammy/react` — beeldcomponent. De WEBSITE kiest de preset per layout-slot;
 * de redacteur bemoeit zich er niet mee. Focal point + verversing zitten in de DAM.
 */

const SLOT_PRESET = {
  hero: "hd",
  banner: "large",
  card: "medium",
  thumb: "small",
} as const;

export type DamImageSlot = keyof typeof SLOT_PRESET;

export function DamImage({
  assetId,
  alt,
  slot = "card",
  width,
  height,
  sizes = "(max-width: 768px) 100vw, 50vw",
  className,
  loading = "lazy",
}: {
  assetId: string;
  alt: string;
  slot?: DamImageSlot;
  width?: number | null;
  height?: number | null;
  sizes?: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const base = `${getDamOrigin()}/api/images`;
  const preset = SLOT_PRESET[slot];
  const srcSet = [
    `${base}/small/${assetId} 400w`,
    `${base}/medium/${assetId} 800w`,
    `${base}/large/${assetId} 1440w`,
    `${base}/hd/${assetId} 1920w`,
  ].join(", ");

  return (
    <img
      src={`${base}/${preset}/${assetId}`}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={width ?? undefined}
      height={height ?? undefined}
      className={className}
      loading={loading}
      decoding="async"
    />
  );
}
