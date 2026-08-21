// /api/availability.js
// Legge l'iCal di una proprietà da SmartPMS e restituisce le date occupate in JSON.
// Esempio: GET /api/availability?property=fumarogo-100d

import { PROPERTIES } from "./_config.js";

function formatDate(d) {
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

export default async function handler(req, res) {
  const property = req.query.property || "sertorelli-26";
  const cfg = PROPERTIES[property];

  if (!cfg) {
    res.status(400).json({ error: `Proprietà sconosciuta: ${property}` });
    return;
  }

  try {
    const response = await fetch(cfg.icalUrl);
    if (!response.ok) {
      throw new Error(`SmartPMS ha risposto ${response.status}`);
    }
    const text = await response.text();

    const blocked = [];
    const events = text.split("BEGIN:VEVENT");
    for (let i = 1; i < events.length; i++) {
      const block = events[i];
      const startMatch = block.match(/DTSTART;VALUE=DATE:(\d{8})/);
      const endMatch = block.match(/DTEND;VALUE=DATE:(\d{8})/);
      if (startMatch && endMatch) {
        blocked.push({
          start: formatDate(startMatch[1]),
          end: formatDate(endMatch[1]),
        });
      }
    }

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=1800");
    res.status(200).json({ property, blocked });
  } catch (err) {
    res.status(500).json({ error: "Impossibile leggere il calendario", details: err.message });
  }
}
