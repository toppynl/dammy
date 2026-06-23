# Changelog

Alle noemenswaardige wijzigingen aan `@getdammy/client`. Volgt semver.

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
