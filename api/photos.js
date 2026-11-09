// /api/photos.js
// Elenco ordinato delle foto di una proprietà, come impostato dal pannello /admin.
// Esempio: GET /api/photos?property=livigno-river  ->  { property, photos: [{url, caption}] }
// Se non c'è nulla (o il database non risponde) risponde con photos: [] e il sito resta com'è.

import { getPhotos } from "./_dyn.js";

export default async function handler(req, res) {
  const property = String(req.query.property || "").replace(/[^a-z0-9-]/gi, "");
  if (!property) {
    res.status(400).json({ error: "Manca property" });
    return;
  }
  const photos = await getPhotos(property);
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  res.status(200).json({ property, photos });
}
