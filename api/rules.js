// /api/rules.js
// Restituisce le regole di pricing (non sensibili) di una proprietà: pulizia, supplemento ospiti.
// Esempio: GET /api/rules?property=sertorelli-26

import { PROPERTIES } from "./_config.js";

export default async function handler(req, res) {
  const property = req.query.property;
  const cfg = PROPERTIES[property];

  if (!cfg) {
    res.status(400).json({ error: `Proprietà sconosciuta: ${property}` });
    return;
  }

  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");
  res.status(200).json({
    property,
    cleaningFeeBase: cfg.cleaningFeeBase || 0,
    cleaningFeePerGuest: cfg.cleaningFeePerGuest || 0,
    baseOccupancy: cfg.baseOccupancy || 2,
    extraGuestFeePerNight: cfg.extraGuestFeePerNight || 0,
  });
}
