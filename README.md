# @getdammy/client

Client-SDK voor de **DAM** — de single source of truth voor beelden. Het CMS/de
website bewaart nooit een bestand, alleen een referentie (`assetId`). De DAM
serveert het beeld met focal point server-side erin, op een stabiele URL die
altijd de laatste versie geeft.

```bash
npm install @getdammy/client
```

## Configuratie (optioneel)

Default wijst naar productie. Override voor staging/self-host:

```ts
import { configureDam } from "@getdammy/client";
configureDam({ origin: "https://dam.woutervanuden.nl" });
```

## Core (`@getdammy/client`) — geen dependencies

```ts
import { openDamPicker, damImageUrl, resolveDamRef } from "@getdammy/client";

// Picker openen (browser), referentie terugkrijgen:
const ref = await openDamPicker({ presets: ["hd", "medium"] });
// → { assetId, alt, width, height, focalX, focalY, urls }

// Stabiele preset-URL bouwen:
damImageUrl(assetId, "hd"); // → {DAM}/api/images/hd/{assetId}

// Huidige metadata + beschikbaarheid (SSR/fallback):
const meta = await resolveDamRef(assetId);
```

## React (`@getdammy/client/react`)

De **website** kiest de preset per slot; de redacteur niet.

```tsx
import { DamImage } from "@getdammy/client/react";

<DamImage assetId={value.assetId} alt={value.alt} slot="hero" />
```

## Payload-veld (kopieerbaar, niet in de package)

Het admin-veld zit **bewust niet** in deze package: het hangt aan de exacte
`@payloadcms/ui`-versie van je project en draait in je admin-bundle. Lever het als
**kopieerbaar component** dat je tegen je eigen Payload-versie onderhoudt — het
gebruikt gewoon de core hierboven (`openDamPicker`, `damImageUrl`). Zie
`DamAssetField.tsx` in de DAM-integratiegids/voorbeelden.

## Hoe het werkt
- **Presets** (globaal, raadbaar): `hd` 1920 · `large` 1440 · `medium` 800 · `small` 400. URL: `{DAM}/api/images/{preset}/{assetId}`.
- **Focal point** zit server-side in de bijsnijdende presets.
- **Verversen** is automatisch: zelfde URL, de DAM purged z'n cache bij elke wijziging (+ ETag-revalidatie). Geen re-save/cache-legen.
- **Resilient**: gecachete beelden blijven serveren als de DAM hapert (`stale-if-error`); render hangt niet aan een live DAM-aanroep.

Volledige API: zie de DAM-integratiegids.
