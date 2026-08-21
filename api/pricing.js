// /api/pricing.js
// Legge i prezzi per notte di una proprietà da PriceLabs.
// Esempio: GET /api/pricing?property=fumarogo-100d&start=2026-08-25&end=2026-09-05

import { PROPERTIES } from "./_config.js";

export default async function handler(req, res) {
  const API_KEY = process.env.PRICELABS_API_KEY;

  if (!API_KEY) {
    res.status(500).json({
      error: "PRICELABS_API_KEY non configurata. Vai su Vercel -> Project Settings -> Environment Variables.",
    });
    return;
  }

  const property = req.query.property || "sertorelli-26";
  const cfg = PROPERTIES[property];

  if (!cfg) {
    res.status(400).json({ error: `Proprietà sconosciuta: ${property}` });
    return;
  }

  const { start, end } = req.query;
  const dateFrom = start || new Date().toISOString().slice(0, 10);
  const dateToDefault = new Date();
  dateToDefault.setDate(dateToDefault.getDate() + 60);
  const dateTo = end || dateToDefault.toISOString().slice(0, 10);

  try {
    const response = await fetch("https://api.pricelabs.co/v1/listing_prices", {
      method: "POST",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        listings: [
          {
            id: cfg.listingId,
            pms: cfg.pms,
            dateFrom,
            dateTo,
            reason: false,
          },
        ],
      }),
    });

    const raw = await response.text();

    if (!response.ok) {
      res.status(response.status).json({
        error: "PriceLabs ha risposto con un errore",
        status: response.status,
        details: raw,
      });
      return;
    }

    const data = JSON.parse(raw);
    const listing = Array.isArray(data) ? data[0] : data;

    const prices = (listing?.data || []).map((d) => ({
      date: d.date,
      price: d.price,
      min_stay: d.min_stay,
      check_in: d.check_in,
      check_out: d.check_out,
    }));

    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
    res.status(200).json({ property, listing_id: cfg.listingId, prices });
  } catch (err) {
    res.status(500).json({ error: "Errore nel contattare PriceLabs", details: err.message });
  }
}
