// /api/_stay.js
// Regola di soggiorno per proprietà (es. arrivo e partenza di sabato, minimo 7 notti).
// Se la proprietà non ha "stayRule" nessun controllo viene applicato.

function dow(dateStr) {
  return new Date(dateStr + "T00:00:00Z").getUTCDay();
}

export function nightsBetween(a, b) {
  return Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 86400000);
}

// Restituisce { ok: true } oppure { ok: false, error: "..." }
export function validateStay(cfg, checkin, checkout) {
  const rule = cfg && cfg.stayRule;
  if (!rule) return { ok: true };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkin || "") || !/^\d{4}-\d{2}-\d{2}$/.test(checkout || "")) {
    return { ok: false, error: "Date non valide." };
  }
  if (rule.checkinDow != null && dow(checkin) !== rule.checkinDow) {
    return { ok: false, error: "L'arrivo è possibile solo di sabato." };
  }
  if (rule.checkoutDow != null && dow(checkout) !== rule.checkoutDow) {
    return { ok: false, error: "La partenza è possibile solo di sabato." };
  }
  if (nightsBetween(checkin, checkout) < (rule.minNights || 1)) {
    return { ok: false, error: `Soggiorno minimo di ${rule.minNights} notti.` };
  }
  return { ok: true };
}

// Applica la regola a una lista di prezzi [{date, price, min_stay, check_in, check_out}]
export function applyStayRule(list, cfg) {
  const rule = cfg && cfg.stayRule;
  if (!rule) return list;
  return list.map((p) => ({
    ...p,
    min_stay: Math.max(Number(p.min_stay) || 1, rule.minNights || 1),
    check_in: rule.checkinDow == null ? p.check_in : dow(p.date) === rule.checkinDow ? 1 : 0,
    check_out: rule.checkoutDow == null ? p.check_out : dow(p.date) === rule.checkoutDow ? 1 : 0,
  }));
}
