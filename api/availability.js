// /api/availability.js
// Legge l'iCal di Sertorelli 26 da SmartPMS e restituisce le date occupate in JSON.
// Esempio: GET /api/availability -> { property: "sertorelli-26", blocked: [{start:"2026-07-25", end:"2026-07-26"}, ...] }

const ICAL_URL =
  "https://pms-api.smartness.com/api/3.0/room-types/generate-ics/6d6f6476306a587a696a2f795a36446d462b45624e773d3d.ics";

function formatDate(d) {
  // d = "20260725" -> "2026-07-25"
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

export default async function handler(req, res) {
  try {
    const response = await fetch(ICAL_URL);
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

    // Cache 15 minuti sull'edge di Vercel: non martelliamo SmartPMS ad ogni visita
    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=1800");
    res.status(200).json({ property: "sertorelli-26", blocked });
  } catch (err) {
    res.status(500).json({ error: "Impossibile leggere il calendario", details: err.message });
  }
}
