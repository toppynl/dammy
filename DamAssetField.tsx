"use client";

/**
 * Payload v3 custom field — "Kies uit DAM".
 * Drop-in voor je Payload-repo. Opent de DAM-picker, bewaart alleen de
 * REFERENTIE (assetId + snapshot), nooit het bestand.
 *
 * ⚠️ Best-effort voor Payload v3 (@payloadcms/ui, useField). Op v2 heet de hook
 *    useFieldType en zijn de imports anders — geef je versie door, dan pas ik 'm aan.
 *
 * Veld-config in je collection:
 *   {
 *     name: "image",
 *     type: "json",            // bewaart { assetId, alt, width, height, focalX, focalY }
 *     admin: { components: { Field: "/components/DamAssetField#DamAssetField" } },
 *   }
 */

import React from "react";
import { useField, FieldLabel, Button } from "@payloadcms/ui";
import { openDamPicker, damImageUrl } from "@getdammy/client";

type Value = {
  assetId: string;
  alt: string;
  width: number | null;
  height: number | null;
  focalX: number;
  focalY: number;
} | null;

export function DamAssetField({
  path,
  field,
}: {
  path: string;
  field?: { label?: string; admin?: { description?: string } };
}) {
  const { value, setValue } = useField<Value>({ path });

  async function choose() {
    const ref = await openDamPicker({
      usage: { source: "payload", field: path },
      // presets hoeven hier niet; de website kiest de preset bij het renderen.
    });
    if (!ref) return;
    setValue({
      assetId: ref.assetId,
      alt: ref.alt,
      width: ref.width,
      height: ref.height,
      focalX: ref.focalX,
      focalY: ref.focalY,
    });
  }

  return (
    <div className="field-type">
      <FieldLabel label={field?.label ?? "Afbeelding (DAM)"} path={path} />

      {value?.assetId ? (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={damImageUrl(value.assetId, "small")}
            alt={value.alt}
            width={72}
            height={72}
            style={{ objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{value.alt}</div>
            <code style={{ fontSize: 11, opacity: 0.6 }}>{value.assetId}</code>
          </div>
          <Button buttonStyle="secondary" size="small" onClick={choose}>
            Wijzigen
          </Button>
          <Button buttonStyle="error" size="small" onClick={() => setValue(null)}>
            Verwijderen
          </Button>
        </div>
      ) : (
        <Button buttonStyle="primary" onClick={choose}>
          Kies uit DAM
        </Button>
      )}
    </div>
  );
}

export default DamAssetField;
