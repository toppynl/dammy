/**
 * dammy — client-SDK voor de DAM (single source of truth voor beelden).
 * Core: nul runtime-dependencies. Zie ook `@getdammy/client/react`.
 */

let damOrigin = "https://dam.woutervanuden.nl";

/** Stel de DAM-origin in (default = productie). Roep dit één keer aan bij init. */
export function configureDam(opts: { origin?: string }): void {
  if (opts.origin) damOrigin = opts.origin.replace(/\/+$/, "");
}

/** De huidige DAM-origin. */
export function getDamOrigin(): string {
  return damOrigin;
}

export type DamAssetRef = {
  assetId: string;
  alt: string;
  width: number | null;
  height: number | null;
  focalX: number;
  focalY: number;
  filename: string;
  contentType: string;
  /** Kant-en-klare preset-URLs (preset → url), als je `presets` meegaf. */
  urls?: Record<string, string>;
};

export type OpenPickerOptions = {
  /** Preset-slugs waarvan je de URLs wilt terugkrijgen, bv. ["hd","medium"]. */
  presets?: string[];
  /** Context voor "waar gebruikt" — komt in de DAM-gebruiksregistratie terecht. */
  usage?: {
    source?: string;
    collection?: string;
    doc?: string;
    field?: string;
    url?: string;
    previousAsset?: string;
  };
  /** Origin waarheen de picker post; default window.location.origin. */
  origin?: string;
};

/** Bouw een stabiele preset-URL uit een asset-id. Focal point + verversing zit
 *  server-side; de website kiest de preset, de redacteur niet. */
export function damImageUrl(assetId: string, preset = "medium"): string {
  return `${damOrigin}/api/images/${preset}/${assetId}`;
}

export type DamRefResult =
  | {
      available: true;
      id: string;
      canonicalId: string;
      version: string;
      filename: string;
      contentType: string;
      isImage: boolean;
      alt: string;
      width: number | null;
      height: number | null;
      focalX: number;
      focalY: number;
      subjectW: number | null;
      subjectH: number | null;
      originalUrl: string;
      presets: string[];
      urls: Record<string, string>;
    }
  | { available: false; id: string; reason: string };

/** Haal de huidige metadata + beschikbaarheid op (voor SSR / fallback).
 *  Throwt niet: bij een netwerk-/parsefout → `{ available:false, reason:"network" }`,
 *  zodat de aanroeper veilig kan degraderen. Caching ligt aan de consument-kant
 *  (framework-cache: bv. Next ISR / fetch-cache). */
export async function resolveDamRef(assetId: string): Promise<DamRefResult> {
  try {
    const res = await fetch(`${damOrigin}/api/assets/${assetId}/ref`);
    return (await res.json()) as DamRefResult;
  } catch {
    return { available: false, id: assetId, reason: "network" };
  }
}

/**
 * Open de DAM-picker (popup) en resolve met de gekozen asset, of `null` als de
 * gebruiker annuleert/sluit. Browser-only.
 */
export function openDamPicker(opts: OpenPickerOptions = {}): Promise<DamAssetRef | null> {
  const origin = opts.origin ?? window.location.origin;

  const qs = new URLSearchParams();
  if (opts.presets?.length) qs.set("presets", opts.presets.join(","));
  qs.set("origin", origin);
  const u = opts.usage;
  if (u?.source) qs.set("usage_source", u.source);
  if (u?.collection) qs.set("usage_collection", u.collection);
  if (u?.doc) qs.set("usage_doc", u.doc);
  if (u?.field) qs.set("usage_field", u.field);
  if (u?.url) qs.set("usage_url", u.url);
  if (u?.previousAsset) qs.set("previous_asset", u.previousAsset);

  const popup = window.open(`${damOrigin}/picker?${qs.toString()}`, "dam-picker", "width=1100,height=800");

  return new Promise((resolve) => {
    let done = false;
    function finish(value: DamAssetRef | null) {
      if (done) return;
      done = true;
      window.removeEventListener("message", onMessage);
      clearInterval(closedTimer);
      resolve(value);
    }
    function onMessage(e: MessageEvent) {
      if (e.origin !== damOrigin) return;
      if (e.data?.type !== "dam:asset-selected") return;
      const a = e.data.asset;
      finish({
        assetId: a.id,
        alt: a.alt,
        width: a.width ?? null,
        height: a.height ?? null,
        focalX: a.focalX,
        focalY: a.focalY,
        filename: a.filename,
        contentType: a.contentType,
        urls: a.urls,
      });
      try { popup?.close(); } catch { /* cross-origin close kan falen */ }
    }
    window.addEventListener("message", onMessage);
    const closedTimer = setInterval(() => {
      if (popup?.closed) finish(null);
    }, 500);
  });
}
