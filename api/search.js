// /api/search.js
// Cerca, tra tutte le proprietà con calendario, quelle libere per le date scelte
// e restituisce il prezzo totale di ciascuna.
// Uso: GET /api/search?checkin=2026-08-25&checkout=2026-08-28&guests=2

import { PROPERTIES } from "./_config.js";

function formatDate(d) {
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

async function getBlockedDates(icalUrl) {
  const response = await fetch(icalUrl);
  if (!response.ok) throw new Error(`iCal error ${response.status}`);
  const text = await response.text();
  const blocked = new Set();
  const events = text.split("BEGIN:VEVENT");
  for (let i = 1; i < events.length; i++) {
    const block = events[i];
    const startMatch = block.match(/DTSTART;VALUE=DATE:(\d{8})/);
    if (startMatch) blocked.add(formatDate(startMatch[1]));
  }
  return blocked;
}

async function getPrices(apiKey, listingId, pms, dateFrom, dateTo) {
  const response = await fetch("https://api.pricelabs.co/v1/listing_prices", {
    method: "POST",
    headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ listings: [{ id: listingId, pms, dateFrom, dateTo, reason: false }] }),
  });
  if (!response.ok) throw new Error(`PriceLabs error ${response.status}`);
  const data = await response.json();
  const listing = Array.isArray(data) ? data[0] : data;
  const map = {};
  (listing?.data || []).forEach((d) => { map[d.date] = d; });
  return map;
}

export default async function handler(req, res) {
  const API_KEY = process.env.PRICELABS_API_KEY;
  const { checkin, checkout, guests } = req.query;

  if (!checkin || !checkout) {
    res.status(400).json({ error: "Servono checkin e checkout (YYYY-MM-DD)" });
    return;
  }
  if (!API_KEY) {
    res.status(500).json({ error: "PRICELABS_API_KEY non configurata." });
    return;
  }

  const guestCount = parseInt(guests, 10) || 2;
  const entries = Object.entries(PROPERTIES).filter(([, cfg]) => cfg.icalUrl && cfg.listingId);

  const results = await Promise.all(
    entries.map(async ([slug, cfg]) => {
      try {
        const [blocked, prices] = await Promise.all([
          getBlockedDates(cfg.icalUrl),
          getPrices(API_KEY, cfg.listingId, cfg.pms, checkin, checkout),
        ]);

        // Verifica libere tutte le notti richieste (dal checkin al giorno prima del checkout)
        let cur = new Date(checkin);
        const end = new Date(checkout);
        let available = true;
        let nightlyTotal = 0;
        let nights = 0;
        while (cur < end) {
          const ds = cur.toISOString().slice(0, 10);
          if (blocked.has(ds)) available = false;
          if (prices[ds]) nightlyTotal += prices[ds].price;
          nights++;
          cur.setDate(cur.getDate() + 1);
        }

        if (!available) return { slug, available: false };

        const extraGuests = Math.max(0, guestCount - (cfg.baseOccupancy || 2));
        const extraGuestTotal = extraGuests * (cfg.extraGuestFeePerNight || 0) * nights;
        const cleaning = (cfg.cleaningFeeBase || 0) + (cfg.cleaningFeePerGuest || 0) * guestCount;
        const total = Math.round(nightlyTotal + extraGuestTotal + cleaning);

        return { slug, available: true, total, nights };
      } catch (err) {
        return { slug, available: false, error: err.message };
      }
    })
  );

  const available = results.filter((r) => r.available).sort((a, b) => a.total - b.total);

  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  res.status(200).json({ checkin, checkout, guests: guestCount, results: available });
}
