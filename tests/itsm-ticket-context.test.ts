import { describe, expect, it } from "vitest";

import {
  pickDemandeurEmployeId,
  summarizeParcDemandeur,
} from "@/lib/itsm/ticket-context";

describe("pickDemandeurEmployeId", () => {
  it("priorise employe_id du ticket", () => {
    expect(
      pickDemandeurEmployeId({
        ticketEmployeId: "emp-1",
        matchedEmployeId: "emp-2",
      })
    ).toBe("emp-1");
  });

  it("utilise le match par nom si pas d'employe_id", () => {
    expect(
      pickDemandeurEmployeId({
        ticketEmployeId: null,
        matchedEmployeId: "emp-2",
      })
    ).toBe("emp-2");
  });

  it("retourne null sans correspondance", () => {
    expect(
      pickDemandeurEmployeId({
        ticketEmployeId: null,
        matchedEmployeId: null,
      })
    ).toBeNull();
  });
});

describe("summarizeParcDemandeur", () => {
  it("compte les matériels actifs et liste les codes", () => {
    const summary = summarizeParcDemandeur([
      { code_materiel: "IAG-PC-001", type: "PC" },
      { code_materiel: "IAG-TEL-012", type: "Smartphone" },
    ]);
    expect(summary.count).toBe(2);
    expect(summary.codes).toEqual(["IAG-PC-001", "IAG-TEL-012"]);
    expect(summary.label).toBe("2 matériels attribués");
  });

  it("gère l'absence de matériel", () => {
    const summary = summarizeParcDemandeur([]);
    expect(summary.count).toBe(0);
    expect(summary.label).toBe("Aucun matériel attribué");
  });
});
