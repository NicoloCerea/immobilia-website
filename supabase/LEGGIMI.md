# Backend del sito Immobilia — messa in funzione

Pannello: https://immobiliaita.it/admin/  (solo team)

## Cosa serve (una volta sola)
1. **Database**: in Supabase (progetto Immobilia.suite) → SQL Editor, eseguire nell'ordine
   `schema.sql`, `seed.sql`, `seed_photos.sql`.
2. **Team**: in Supabase → Authentication → Users → "Add user" per ogni persona (email + password scelta da loro).
   Poi, nell'SQL Editor, abilitarli (email SEMPRE in minuscolo):
   `insert into site_admins (email, role) values ('nome@dominio.it','owner');`
   Chi ha un account ma non è in `site_admins` non entra e non vede nulla.
3. **Vercel** → Settings → Environment Variables, aggiungere (Production):
   `SUPABASE_URL` = https://tpiehsglwgipelefonnw.supabase.co
   `SUPABASE_ANON_KEY` = la chiave "anon" del progetto (la stessa che sta in admin/config.js)
   Senza queste due variabili il sito continua a funzionare come prima, con i valori del codice.
4. Fare il deploy e provare il pannello.

## Come funziona
- Tariffe/pulizie/regole/prezzi fissi/foto salvati qui sostituiscono i valori del codice entro ~1 minuto.
- Database spento o non raggiungibile → il sito usa i valori del codice (provato con test).
- Le proprietà non ancora in `api/_config.js` (Franz 1/2/3, Zanchetta, Crosc) hanno solo le foto attive.
- Prezzo fisso del calendario = prezzo finale; le regole (aumento/sconto per periodo, weekend) si applicano
  al prezzo base di PriceLabs già scontato; sconto per proprietà sostituisce lo sconto generale.
- Tutto quello che il team cambia finisce nel Registro.

## Non incluso (fase successiva)
- Sconto per soggiorno lungo (richiede una modifica al calcolo nelle pagine).
- Ricalcolo del totale lato server in `stripe-checkout.js` (oggi si fida dell'importo dal browser).
- Nuove proprietà create dal pannello (si aggiungono ancora in `api/_config.js`).
