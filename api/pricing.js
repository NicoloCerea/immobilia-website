// /api/pricing.js
// Legge i prezzi per notte di Sertorelli 26 da PriceLabs.
// Esempio: GET /api/pricing?start=2026-08-25&end=2026-09-05
// Risposta: { property: "sertorelli-26", prices: [{date:"2026-08-25", price: 165, min_stay: 2, checkin_allowed:true, checkout_allowed:true}, ...] }

const LISTING_ID = "145903___14556"; // Sertorelli 26
const PMS = "ciaobooking";

export default async function handler(req, res) {
  const API_KEY = process.env.PRICELABS_API_KEY;

  if (!API_KEY) {
    res.status(500).json({
      error: "PRICELABS_API_KEY non configurata. Vai su Vercel -> Project Settings -> Environment Variables.",
    });
    return;
  }

  const { start, end } = req.query;

  try {
    const url = new URL("https://api.pricelabs.co/v1/listing_prices");
    url.searchParams.set("listing_id", LISTING_ID);
    url.searchParams.set("pms", PMS);
    if (start) url.searchParams.set("start_date", start);
    if (end) url.searchParams.set("end_date", end);

    const response = await fetch(url.toString(), {
      headers: {
        "X-API-Key": API_KEY,
        Accept: "application/json",
      },
    });

    const raw = await response.text();

    if (!response.ok) {
      // Restituiamo il messaggio di errore esatto di PriceLabs: ci serve per capire
      // se il nome dell'endpoint o i parametri vanno corretti.
      res.status(response.status).json({
        error: "PriceLabs ha risposto con un errore",
        status: response.status,
        details: raw,
      });
      return;
    }

    const data = JSON.parse(raw);
    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
    res.status(200).json({ property: "sertorelli-26", listing_id: LISTING_ID, prices: data });
  } catch (err) {
    res.status(500).json({ error: "Errore nel contattare PriceLabs", details: err.message });
  }
}
