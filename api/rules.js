// /api/rules.js
// Restituisce le regole di pricing (non sensibili) di una proprietà: pulizia, supplemento ospiti.
// Esempio: GET /api/rules?property=sertorelli-26

import { PROPERTIES } from "./_config.js";
import { getDynamic, effectiveFees } from "./_dyn.js";

export default async function handler(req, res) {
  const property = req.query.property;
  const cfg = PROPERTIES[property];

  if (!cfg) {
    res.status(400).json({ error: `Proprietà sconosciuta: ${property}` });
    return;
  }

  // valori del pannello /admin sopra quelli del codice (se il database non c'è, restano quelli del codice)
  const dyn = await getDynamic(property);
  const fees = effectiveFees(cfg, dyn);

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  res.status(200).json({ property, ...fees, stayRule: cfg.stayRule || null, depositOnly: !!cfg.depositOnly });
}
