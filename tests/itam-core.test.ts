import { describe, expect, it } from "vitest";

import {
  computeNextMaterielCode,
  normalizeMaterielCode,
  normalizeMaterielType,
  parseMaterielCodeSequence,
} from "@/lib/utils/materiel-taxonomy";
import { normalizeAccessoireSousCategorie } from "@/lib/utils/accessoire-sous-categories";
import { shouldUseAttributionDirectFallback } from "@/lib/server/create-attribution-transaction";
import { normalizeMaterielStatut } from "@/lib/materiel/statuts";

describe("nomenclature matériel", () => {
  it("normalise Téléphone vers Smartphone", () => {
    expect(normalizeMaterielType("Téléphone")).toBe("Smartphone");
  });

  it("normalise Accessoire et aliases", () => {
    expect(normalizeMaterielType("Accessoire")).toBe("Accessoire");
    expect(normalizeMaterielType("souris")).toBe("Accessoire");
    expect(normalizeMaterielType("Chargeur")).toBe("Accessoire");
  });

  it("préfixe IAG-ACC pour Accessoire", () => {
    expect(computeNextMaterielCode([], "IAG-ACC")).toBe("IAG-ACC-001");
    expect(computeNextMaterielCode(["IAG-ACC-001", "IAG-ACC-012"], "IAG-ACC")).toBe(
      "IAG-ACC-013"
    );
  });
});

describe("sous-catégories accessoires", () => {
  it("normalise les alias", () => {
    expect(normalizeAccessoireSousCategorie("souris")).toBe("Souris");
    expect(normalizeAccessoireSousCategorie("Hub")).toBe("Hub / Dock");
    expect(normalizeAccessoireSousCategorie("chargeur")).toBe("Chargeur");
  });
});

describe("nomenclature matériel suite", () => {
  it("normalise un code legacy", () => {
    expect(normalizeMaterielCode("TEL-049")).toBe("IAG-TEL-049");
  });

  it("propose le code suivant", () => {
    expect(computeNextMaterielCode(["IAG-TEL-049", "IAG-TEL-050"], "IAG-TEL")).toBe(
      "IAG-TEL-051"
    );
  });

  it("parse une séquence", () => {
    expect(parseMaterielCodeSequence("IAG-PC-007")).toEqual({
      prefix: "IAG-PC",
      number: 7,
      padLength: 3,
    });
  });
});

describe("statuts matériel", () => {
  it("mappe Disponible vers Stock", () => {
    expect(normalizeMaterielStatut("Disponible")).toBe("Stock");
  });
});

describe("fallback RPC attribution", () => {
  it("détecte une fonction absente", () => {
    expect(
      shouldUseAttributionDirectFallback("Could not find the function public.create_attribution_transaction")
    ).toBe(true);
  });

  it("ne bascule pas sur une erreur métier", () => {
    expect(shouldUseAttributionDirectFallback("Matériel déjà attribué")).toBe(false);
  });
});
