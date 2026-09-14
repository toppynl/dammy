/**
 * dammy — client-SDK voor de DAM (single source of truth voor beelden).
 * Core: nul runtime-dependencies. Zie ook `@getdammy/client/react`.
 */

// dam.oftomorrow.eu = productie sinds de verhuizing (2026-08);
// dam.woutervanuden.nl is de bevroren read-only legacy-omgeving.
let damOrigin = "https://dam.oftomorrow.eu";
// Parametrische delivery-Worker (zie cdn-delivery.md in de DAM-repo). Alleen
// gebruikt als terugval wanneer een ref géén `cdn.base` meedraagt.
let damCdnOrigin = "https://cdn.dam.oftomorrow.eu";

/** Stel de DAM-origin (en optioneel de CDN-origin) in. Default = productie.
 *  Roep dit één keer aan bij init. */
export function configureDam(opts: { origin?: string; cdnOrigin?: string }): void {
  if (opts.origin) damOrigin = opts.origin.replace(/\/+$/, "");
  if (opts.cdnOrigin) damCdnOrigin = opts.cdnOrigin.replace(/\/+$/, "");
}

/** De huidige DAM-origin. */
export function getDamOrigin(): string {
  return damOrigin;
}

/** De huidige CDN-origin (terugval als een ref geen `cdn.base` heeft). */
export function getDamCdnOrigin(): string {
  return damCdnOrigin;
}

/** Uitsnede in bron-pixels; `outWidth/outHeight` = gekozen uitvoerformaat. */
export type DamCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
  outWidth?: number;
  outHeight?: number;
};

/** Het `cdn`-blok dat de DAM meestuurt zodra de delivery-Worker in die omgeving
 *  geconfigureerd is. `base` = `https://cdn…/<assetId>`, `v` = versiestempel
 *  (gelijk aan `imageVersion`), `g` = focuspunt als `<x>x<y>`. `urls` zijn
 *  kant-en-klare geversiede URLs per systeempreset; `presets` hun breedte. */
export type DamCdnBlock = {
  base: string;
  v: string;
  g: string;
  presets: Record<string, { w: number }>;
  urls: Record<string, string>;
};

export type DamAssetRef = {
  assetId: string;
  alt: string;
  width: number | null;
  height: number | null;
  focalX: number;
  focalY: number;
  filename: string;
  contentType: string;
  /** Kant-en-klare preset-URLs (preset → url), als je `presets` meegaf.
   *  Inclusief eventuele uitsnede (`?crop=`) en variant (`?variant=`). */
  urls?: Record<string, string>;
  /** De URL volgens het in de picker gekozen formaat, incl. uitsnede/variant. */
  url?: string;
  /** Het onbewerkte bestand (zonder uitsnede). */
  originalUrl?: string;
  /** Kant-en-klare `srcset`-string over alle formaten met bekende breedte. */
  srcset?: string;
  /** Gekozen preset-slug, of `null` bij origineel. */
  preset?: string | null;
  /** Gekozen uitsnede, als de redacteur er een maakte. */
  crop?: DamCrop;
  /** Gekozen asset-variant (in de DAM voorbereide uitsnede), of `null`. */
  variant?: string | null;
  /** Blurhash van het hoofdbeeld — voor een blur-up placeholder. `null` als de
   *  DAM er (nog) geen heeft; bij een variant/crop is dit de hash van het
   *  volledige beeld, niet van de uitsnede. */
  blurHash?: string | null;
  /** Opaque versiestempel van de pixels (wisselt alleen bij een echte beeld- of
   *  focal-wijziging). `null` als de DAM 'm niet kon leveren; dan géén `cdn`. */
  imageVersion?: string | null;
  /** CDN-blok — afwezig als de DAM-omgeving geen delivery-Worker heeft. */
  cdn?: DamCdnBlock;
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
  /**
   * Scoped koppeling: een endpoint op JÓUW backend dat een vers, kortlevend
   * picker-token int (POST → `{ token }`). Zet je dit, dan opent de picker
   * brand-gepind en read-only en heeft de redacteur géén DAM-account nodig.
   * Het integratie-geheim blijft zo server-side. Zie de integratiegids.
   */
  tokenEndpoint?: string;
  /**
   * Zachte voorkeuze van de startmap (DAM-categorie-id): de picker opent meteen
   * in die map, maar de redacteur mag binnen z'n brand rondkijken. Wordt via
   * `tokenEndpoint` doorgegeven aan je backend.
   */
  folder?: string;
};

/** Bouw een stabiele preset-URL uit een asset-id. Focal point + verversing zit
 *  server-side; de website kiest de preset, de redacteur niet. */
export function damImageUrl(assetId: string, preset = "medium"): string {
  return `${damOrigin}/api/images/${preset}/${assetId}`;
}


/* ───────────────────────── CDN (parametrische levering) ───────────────────────── */

/** Breedte-allowlist van de delivery-Worker. Een `w` buiten deze lijst is een
 *  403, dus elke breedte die de SDK uitgeeft wordt omhoog gesnapt. */
export const DAM_CDN_WIDTHS = [80, 160, 240, 320, 480, 640, 768, 960, 1024, 1280, 1600, 1920] as const;
export type DamCdnWidth = (typeof DAM_CDN_WIDTHS)[number];
export type DamCdnAspectRatio = "orig" | "1:1" | "4:3" | "3:4" | "16:9" | "8:1";
export type DamCdnFit = "cover" | "contain";
export type DamCdnDpr = 1 | 2;

/** Rond omhoog naar de eerstvolgende toegestane breedte; daarboven de grootste. */
export function snapDamCdnWidth(width: number): DamCdnWidth {
  for (const rung of DAM_CDN_WIDTHS) if (rung >= width) return rung;
  return DAM_CDN_WIDTHS[DAM_CDN_WIDTHS.length - 1];
}

/** Het minimum dat `damCdnUrl` nodig heeft: een `DamAssetRef` voldoet. */
export type DamCdnRefInput = {
  assetId: string;
  imageVersion?: string | null;
  focalX?: number | null;
  focalY?: number | null;
  variant?: string | null;
  cdn?: DamCdnBlock | null;
};

export type DamCdnUrlOptions = {
  /** Gewenste breedte in CSS-px; wordt omhoog gesnapt naar de allowlist. */
  w: number;
  /** Default `orig` (wordt dan weggelaten). */
  ar?: DamCdnAspectRatio;
  /** Default `cover` (alleen relevant bij `ar` ≠ `orig`). */
  fit?: DamCdnFit;
  /** Default `1`. */
  dpr?: DamCdnDpr;
};

function isCdnBlock(x: unknown): x is DamCdnBlock {
  if (!x || typeof x !== "object") return false;
  const b = x as Record<string, unknown>;
  return typeof b.base === "string" && typeof b.v === "string" && typeof b.g === "string";
}

/** Focuspunt als `<x>x<y>`, byte-identiek aan wat de DAM zelf uitgeeft. */
function formatGravity(x: number, y: number): string {
  const f = (n: number) => Number(Math.max(0, Math.min(1, n)).toFixed(4)).toString();
  return `${f(x)}x${f(y)}`;
}

/** Kan deze ref over de CDN geleverd worden? (heeft een versiestempel) */
export function hasDamCdn(ref: DamCdnRefInput): boolean {
  return !!(ref.cdn?.v ?? ref.imageVersion);
}

/**
 * Bouw één CDN-URL voor een gekozen asset volgens het parametrische contract
 * (`/<assetId>?w=&ar=&fit=&dpr=&v=&g=&variant=`). Geeft `null` als de ref geen
 * versiestempel heeft (asset gekozen vóór de CDN-migratie, of een DAM-omgeving
 * zonder Worker) — val dan terug op `damImageUrl`.
 *
 * Inerte parameters worden weggelaten zodat de cache niet splijt: `fit` en `g`
 * doen niets bij `ar=orig`, en `g` doet niets bij `fit=contain`.
 */
export function damCdnUrl(ref: DamCdnRefInput, opts: DamCdnUrlOptions): string | null {
  const v = ref.cdn?.v ?? ref.imageVersion ?? null;
  if (!v) return null;
  const { ar = "orig", fit = "cover", dpr = 1 } = opts;
  const base = ref.cdn?.base ?? `${damCdnOrigin}/${encodeURIComponent(ref.assetId)}`;
  const q = new URLSearchParams();
  q.set("w", String(snapDamCdnWidth(opts.w)));
  if (ar !== "orig") q.set("ar", ar);
  if (ar !== "orig" && fit !== "cover") q.set("fit", fit);
  if (dpr !== 1) q.set("dpr", String(dpr));
  q.set("v", v);
  if (ar !== "orig" && fit !== "contain") {
    const g = ref.cdn?.g ?? (ref.focalX != null && ref.focalY != null ? formatGravity(ref.focalX, ref.focalY) : null);
    if (g) q.set("g", g);
  }
  if (ref.variant) q.set("variant", ref.variant);
  return `${base}?${q.toString()}`;
}

/**
 * Kant-en-klare `srcset` over de CDN-ladder. Zonder `maxWidth` de hele ladder;
 * met `maxWidth` (bv. `ref.width`, de bronbreedte) alleen de treden tot en met
 * de eerste die de bron haalt — de Worker schaalt toch nooit op. `null` als de
 * ref niet over de CDN kan.
 */
export function damCdnSrcSet(
  ref: DamCdnRefInput,
  opts: { maxWidth?: number | null; ar?: DamCdnAspectRatio; fit?: DamCdnFit } = {},
): string | null {
  if (!hasDamCdn(ref)) return null;
  const max = opts.maxWidth ?? Infinity;
  const parts: string[] = [];
  for (const w of DAM_CDN_WIDTHS) {
    const url = damCdnUrl(ref, { w, ar: opts.ar, fit: opts.fit });
    if (!url) return null;
    parts.push(`${url} ${w}w`);
    if (w >= max) break;
  }
  return parts.join(", ");
}

/** Langste zijde van de systeempresets (gelijk aan de DAM's `SYSTEM_PRESETS`). */
const PRESET_WIDTHS = { hd: 1920, large: 1200, medium: 640, small: 320 } as const;
export type DamSystemPreset = keyof typeof PRESET_WIDTHS;

/**
 * Beste beeld-URL voor een preset-slot: over de CDN als de ref dat kan (breedte
 * van de systeempreset, gesnapt), anders de klassieke preset-route. Laat
 * bestaande `damImageUrl(assetId, preset)`-aanroepen ongemoeid.
 */
export function damRefImageUrl(ref: DamCdnRefInput, preset: DamSystemPreset = "medium"): string {
  const w = ref.cdn?.presets?.[preset]?.w ?? PRESET_WIDTHS[preset];
  return damCdnUrl(ref, { w }) ?? damImageUrl(ref.assetId, preset);
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
      imageVersion?: string | null;
      focal?: { x: number; y: number };
      cdn?: DamCdnBlock;
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

  // Scoped koppeling: de popup MÓET binnen het klik-gebaar openen (anders
  // blokkeert de browser 'm), dus open 'm leeg, haal een vers token van je eigen
  // backend en navigeer 'm daarna naar de brand-gepinde picker.
  if (opts.tokenEndpoint) {
    const popup = window.open("about:blank", "dam-picker", "width=1100,height=800");
    const result = waitForSelection(popup);
    void (async () => {
      try {
        const res = await fetch(opts.tokenEndpoint!, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(opts.folder ? { folder: opts.folder } : {}),
        });
        const data = (await res.json()) as { token?: string };
        if (data?.token) qs.set("session", data.token);
      } catch {
        /* val terug op het normale (login-)pad van de picker */
      }
      if (popup) popup.location.href = `${damOrigin}/picker?${qs.toString()}`;
    })();
    return result;
  }

  const popup = window.open(`${damOrigin}/picker?${qs.toString()}`, "dam-picker", "width=1100,height=800");
  return waitForSelection(popup);
}

/** Wacht op de `dam:asset-selected`-postMessage uit de picker-popup (of `null`
 *  als de gebruiker 'm sluit). Gedeeld door de scoped- en login-modus. */
function waitForSelection(popup: Window | null): Promise<DamAssetRef | null> {
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
        url: a.url,
        originalUrl: a.originalUrl,
        srcset: a.srcset,
        preset: a.preset ?? null,
        crop: a.crop,
        variant: a.variant ?? null,
        blurHash: a.blurHash ?? null,
        imageVersion: typeof a.imageVersion === "string" ? a.imageVersion : null,
        ...(isCdnBlock(a.cdn) ? { cdn: a.cdn } : {}),
      });
      try { popup?.close(); } catch { /* cross-origin close kan falen */ }
    }
    window.addEventListener("message", onMessage);
    const closedTimer = setInterval(() => {
      if (popup?.closed) finish(null);
    }, 500);
  });
}
