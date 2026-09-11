# Changelog

Alle noemenswaardige wijzigingen aan `@getdammy/client`. Volgt semver.

## 0.5.0
### Toegevoegd
- **`imageVersion` en `cdn` komen door de selectie-payload.** De picker stuurt
  sinds de CDN-migratie een opaque versiestempel (`imageVersion`) en, als de
  DAM-omgeving een delivery-Worker heeft, een `cdn`-blok (`base`, `v`, `g`,
  `presets`, `urls`) mee. 0.4.0 hield die tegen; `DamAssetRef` draagt ze nu
  (optioneel, additief — bestaande refs blijven geldig).
- **CDN-helpers in de core**, zodat geen afnemer z'n eigen URL-bouwer hoeft te
  schrijven: `damCdnUrl(ref, { w, ar?, fit?, dpr? })` (snapt `w` omhoog naar de
  Worker-allowlist, laat inerte parameters weg), `damCdnSrcSet(ref, { maxWidth })`,
  `damRefImageUrl(ref, preset)` (CDN als het kan, anders de preset-route),
  `hasDamCdn(ref)`, `snapDamCdnWidth`, `DAM_CDN_WIDTHS`. Alles geeft `null` /
  valt terug op de preset-route voor refs van vóór de CDN-migratie.
- `configureDam({ cdnOrigin })` voor staging/self-host; default
  `https://cdn.dam.oftomorrow.eu`. Een `cdn.base` in de ref wint altijd.
- `DamImage` accepteert nu de hele ref als `asset` en levert dan over de CDN
  (ladder begrensd op de bronbreedte). `assetId`-only blijft werken zoals het was.
- `DamRefResult` (van `resolveDamRef`) typeert `imageVersion`, `focal` en `cdn`.
### Gewijzigd
- `blurHash`-documentatie aangescherpt: het is de hash van het **hoofdbeeld**
  (niet van een variant/crop) en de DAM vult 'm sinds deze release ook bij
  selectie in de picker, dus hij is zelden nog `null` voor nieuw gekozen assets.

## 0.4.0
### Toegevoegd
- **Payload-doorgeefluik**: de picker stuurt sinds kort meer mee dan de SDK
  doorliet. `DamAssetRef` bevat nu ook `url` (de URL volgens het in de picker
  gekozen formaat), `originalUrl`, `srcset` (kant-en-klaar voor responsive
  beelden), `preset`, `crop` (uitsnede in bron-pixels, incl. gekozen
  uitvoerformaat), `variant` (in de DAM voorbereide uitsnede) en `blurHash`
  (blur-up placeholder). Alles optioneel en additief — bestaande afnemers
  blijven ongewijzigd werken.
### Gewijzigd
- Default-origin is nu **https://dam.oftomorrow.eu** (de DAM is verhuisd;
  dam.woutervanuden.nl is read-only legacy). Wie `configureDam({ origin })`
  aanroept merkt niets.

## 0.3.0
### Toegevoegd
- **Scoped picker-koppeling** (`openDamPicker({ tokenEndpoint, folder })`). Geef
  een `tokenEndpoint` op je eigen backend op, dan opent de picker **brand-gepind
  en read-only** — de redacteur heeft géén DAM-account meer nodig en zit altijd
  in de juiste brand. Het integratie-geheim blijft server-side; de SDK haalt per
  keer een vers, kortlevend token op. Model à la Bynder Compact View / Frontify
  Finder. `folder` opent meteen in een bepaalde DAM-map (zachte voorkeuze).
- Voorbeeld-veld (`DamAssetField.tsx`) bijgewerkt met het token-endpoint-patroon
  + een voorbeeld-backendroute.

Zonder `tokenEndpoint` blijft het oude gedrag (persoonlijke DAM-login) werken —
niet-brekend.

## 0.2.1
- Publieke broncode-repo: [github.com/toppynl/dammy](https://github.com/toppynl/dammy)
  (`repository`/`homepage`/`bugs` toegevoegd zodat npm naar de repo + changelog linkt).

## 0.2.0
### Breaking
- **Payload-veld uit de package gehaald.** Het admin-veld hangt aan de exacte
  `@payloadcms/ui`-versie van elke afnemer en draait in de admin-bundle; dat
  hoort niet in een gedeelde package met een losse peer-range. Het wordt nu
  geleverd als **kopieerbaar voorbeeld** (`DamAssetField.tsx`) dat je tegen je
  eigen Payload-versie onderhoudt. Het subpad `@getdammy/client/payload` en de
  `@payloadcms/ui`-peer zijn verwijderd.

### Verbeterd
- `resolveDamRef` throwt niet meer: bij een netwerk-/parsefout → `{ available:false, reason:"network" }`.

## 0.1.0
- Eerste release: core (`openDamPicker`, `damImageUrl`, `resolveDamRef`,
  `configureDam`) + `@getdammy/client/react` (`DamImage`).
