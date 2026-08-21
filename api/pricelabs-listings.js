// /api/pricelabs-listings.js
// Elenca tutti i listing collegati al tuo account PriceLabs, con il loro listing_id e pms.
// Serve UNA VOLTA SOLA per trovare l'ID di Sertorelli 26 da usare nella prossima funzione (prezzi).
// Dopo aver trovato l'ID, questo file si può anche eliminare.
//
// IMPORTANTE: richiede la variabile d'ambiente PRICELABS_API_KEY impostata su Vercel
// (Project Settings -> Environment Variables), NON scritta nel codice.

export default async function handler(req, res) {
  const API_KEY = process.env.PRICELABS_API_KEY;

  if (!API_KEY) {
    res.status(500).json({
      error: "PRICELABS_API_KEY non configurata. Vai su Vercel -> Project Settings -> Environment Variables e aggiungila.",
    });
    return;
  }

  try {
    const response = await fetch("https://api.pricelabs.co/v1/listings", {
      headers: {
        "X-API-Key": API_KEY,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`PriceLabs ha risposto ${response.status}: ${body}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Errore nel contattare PriceLabs", details: err.message });
  }
}
