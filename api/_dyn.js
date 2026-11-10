// /api/_dyn.js
// Legge dal database (Supabase) le modifiche fatte dal pannello /admin e le applica sopra
// i valori che oggi stanno in _config.js.
//
// REGOLA D'ORO: se il database non è configurato, non risponde o è vuoto, non cambia NIENTE:
// il sito continua a funzionare esattamente come prima, con i valori del codice.
//
// Variabili d'ambiente (Vercel): SUPABASE_URL, SUPABASE_ANON_KEY  (la chiave "anon" è pubblica per natura:
// le viste lette qui non contengono dati riservati come le commissioni dei proprietari).

const TTL_MS = 60 * 1000;
const TIMEOUT_MS = 1500;
const cache = new Map(); // chiave -> { at, data }

async function rest(path) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${path}`, {
      headers: key.startsWith("eyJ") ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key },
      signal: ctl.signal,
    });
    if (!r.ok) return hit ? hit.data : null;
    const data = await r.json();
    cache.set(path, { at: Date.now(), data });
    return data;
  } catch {
    return hit ? hit.data : null; // in caso di errore usa l'ultimo valore buono, altrimenti niente
  } finally {
    clearTimeout(timer);
  }
}

// Restituisce { props, overrides, rules } per una proprietà, oppure null se non c'è nulla da applicare.
export async function getDynamic(slug) {
  const s = encodeURIComponent(slug);
  const [props, overrides, rules] = await Promise.all([
    rest(`site_public_properties?slug=eq.${s}&select=*`),
    rest(`site_public_overrides?property_slug=eq.${s}&select=*&order=date_from.asc`),
    rest(`site_public_rules?or=(property_slug.eq.${s},property_slug.is.null)&select=*&order=priority.asc`),
  ]);
  if (!props || !props[0]) return null; // proprietà non presente nel database: resta tutto com'è
  return { props: props[0], overrides: overrides || [], rules: rules || [] };
}

// Regole di pulizia/ospiti/animali effettive (database sopra codice).
export function effectiveFees(cfg, dyn) {
  const base = {
    cleaningFeeBase: cfg.cleaningFeeBase || 0,
    cleaningFeePerGuest: cfg.cleaningFeePerGuest || 0,
    cleaningFeeByGuests: cfg.cleaningFeeByGuests || null,
    baseOccupancy: cfg.baseOccupancy || 2,
    extraGuestFeePerNight: cfg.extraGuestFeePerNight || 0,
    petFee: cfg.petFee || 0,
  };
  if (!dyn) return base;
  const p = dyn.props;
  return {
    cleaningFeeBase: num(p.cleaning_fee_base, base.cleaningFeeBase),
    cleaningFeePerGuest: num(p.cleaning_fee_per_guest, base.cleaningFeePerGuest),
    cleaningFeeByGuests: p.cleaning_fee_by_guests && Object.keys(p.cleaning_fee_by_guests).length ? p.cleaning_fee_by_guests : null,
    baseOccupancy: num(p.base_occupancy, base.baseOccupancy),
    extraGuestFeePerNight: num(p.extra_guest_fee_per_night, base.extraGuestFeePerNight),
    petFee: num(p.pet_fee, base.petFee),
  };
}

function num(v, fallback) {
  const n = Number(v);
  return v === null || v === undefined || Number.isNaN(n) ? fallback : n;
}

export function effectiveDiscount(globalPercent, dyn) {
  if (dyn && dyn.props.discount_percent !== null && dyn.props.discount_percent !== undefined) {
    return Number(dyn.props.discount_percent);
  }
  return globalPercent || 0;
}

function dayOfWeek(dateStr) {
  return new Date(dateStr + "T00:00:00Z").getUTCDay(); // 0 = domenica
}

function inRange(d, from, to) {
  return (!from || d >= from) && (!to || d <= to);
}

// Applica prezzi fissi e regole a un singolo prezzo notturno già scontato.
// Ritorna il prezzo finale in euro interi.
export function hasOverride(date, dyn) { return !!(dyn && dyn.overrides.some((o) => inRange(date, o.date_from, o.date_to))); }

export function adjustNight(date, price, dyn) {
  if (!dyn) return price;
  const fixed = dyn.overrides.find((o) => inRange(date, o.date_from, o.date_to));
  if (fixed) return Math.round(Number(fixed.price));
  let p = price;
  let changed = false;
  for (const r of dyn.rules) {
    if (!inRange(date, r.date_from, r.date_to)) continue;
    const pct = Number(r.params && r.params.percent);
    if (!pct || Number.isNaN(pct)) continue;
    if (r.kind === "percent_adjust") { p *= 1 + pct / 100; changed = true; }
    else if (r.kind === "weekend_markup") {
      const dow = dayOfWeek(date); // notte di venerdì o sabato
      if (dow === 5 || dow === 6) { p *= 1 + pct / 100; changed = true; }
    }
  }
  // senza regole applicate il prezzo resta com'è (i prezzi manuali dei Franz sono frazionari: arrotondare farebbe derivare il totale settimanale)
  if (!changed) return p;
  return Math.max(1, Math.round(p));
}

// Applica tutto a una lista [{date, price, min_stay, ...}] e aggiunge i giorni con prezzo fisso mancanti.
export function adjustPriceList(list, dyn, start, end, defaultMinStay = 1) {
  if (!dyn) return list;
  const out = list.map((e) => ({ ...e, price: adjustNight(e.date, e.price, dyn) }));
  if (dyn.props.min_stay) out.forEach((e) => { e.min_stay = dyn.props.min_stay; });
  const have = new Set(out.map((e) => e.date));
  for (const o of dyn.overrides) {
    const from = start && start > o.date_from ? start : o.date_from;
    const to = end && end < o.date_to ? end : o.date_to;
    for (let d = new Date(from + "T00:00:00Z"); d <= new Date(to + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + 1)) {
      const ds = d.toISOString().slice(0, 10);
      if (!have.has(ds)) {
        out.push({ date: ds, price: Math.round(Number(o.price)), min_stay: dyn.props.min_stay || defaultMinStay, check_in: 1, check_out: 1 });
        have.add(ds);
      }
    }
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : 1));
}

// Foto di una proprietà nell'ordine scelto dal team. Ritorna [] se non ce ne sono (il sito usa allora le foto del codice).
export async function getPhotos(slug) {
  const s = encodeURIComponent(slug);
  const rows = await rest(`site_public_photos?property_slug=eq.${s}&select=storage_path,caption,position&order=position.asc`);
  if (!rows || !rows.length) return [];
  const base = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  return rows.map((r) => ({
    url: r.storage_path.startsWith("images/") ? "/" + r.storage_path : `${base}/storage/v1/object/public/site-photos/${r.storage_path}`,
    caption: r.caption || "",
  }));
}
