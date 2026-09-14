import React from "react";
import { damCdnSrcSet, damCdnUrl, getDamOrigin, hasDamCdn, type DamCdnRefInput } from "./index";

/**
 * `dammy/react` — beeldcomponent. De WEBSITE kiest de preset per layout-slot;
 * de redacteur bemoeit zich er niet mee. Focal point + verversing zitten in de DAM.
 *
 * Geef je de hele picker-ref mee (`asset`), dan levert de component over de CDN
 * (parametrische ladder, versiestempel in de URL) zodra de ref dat kan; anders
 * valt hij terug op de klassieke preset-route. Alleen een `assetId` = altijd
 * de preset-route.
 */

const SLOT_PRESET = {
  hero: "hd",
  banner: "large",
  card: "medium",
  thumb: "small",
} as const;

/** Streefbreedte per slot op de CDN-ladder (langste zijde van de systeempreset). */
const SLOT_WIDTH = { hero: 1920, banner: 1280, card: 640, thumb: 320 } as const;

export type DamImageSlot = keyof typeof SLOT_PRESET;

export type DamImageAsset = DamCdnRefInput & {
  alt?: string;
  width?: number | null;
  height?: number | null;
};

export function DamImage({
  assetId,
  asset,
  alt,
  slot = "card",
  width,
  height,
  sizes = "(max-width: 768px) 100vw, 50vw",
  className,
  loading = "lazy",
}: {
  /** Asset-id (klassieke preset-route). Niet nodig als je `asset` meegeeft. */
  assetId?: string;
  /** De picker-ref (`DamAssetRef`) — levert over de CDN als die beschikbaar is. */
  asset?: DamImageAsset | null;
  alt?: string;
  slot?: DamImageSlot;
  width?: number | null;
  height?: number | null;
  sizes?: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const id = asset?.assetId ?? assetId;
  if (!id) return null;
  const w = width ?? asset?.width ?? undefined;
  const h = height ?? asset?.height ?? undefined;
  const altText = alt ?? asset?.alt ?? "";

  let src: string;
  let srcSet: string;
  if (asset && hasDamCdn(asset)) {
    src = damCdnUrl(asset, { w: SLOT_WIDTH[slot] })!;
    srcSet = damCdnSrcSet(asset, { maxWidth: asset.width ?? undefined })!;
  } else {
    const base = `${getDamOrigin()}/api/images`;
    src = `${base}/${SLOT_PRESET[slot]}/${id}`;
    srcSet = [
      `${base}/small/${id} 400w`,
      `${base}/medium/${id} 800w`,
      `${base}/large/${id} 1440w`,
      `${base}/hd/${id} 1920w`,
    ].join(", ");
  }

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={altText}
      width={w}
      height={h}
      className={className}
      loading={loading}
      decoding="async"
    />
  );
}
