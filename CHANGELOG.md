# Changelog

Alle noemenswaardige wijzigingen aan `@getdammy/client`. Volgt semver.

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
