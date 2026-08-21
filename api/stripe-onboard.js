// /api/stripe-onboard.js
// Crea un account Stripe Connect Express per il proprietario di una proprietà
// e restituisce il link di verifica da mandargli (email/WhatsApp).
//
// USO (una volta sola per proprietà, poi si salva l'ID che restituisce):
// GET /api/stripe-onboard?property=sertorelli-26
//
// Risposta: { accountId: "acct_...", onboardingUrl: "https://connect.stripe.com/..." }
// -> l'accountId va copiato manualmente in _config.js (campo stripeAccountId)
// -> l'onboardingUrl va mandato al proprietario, scade dopo pochi minuti se non usato

import { PROPERTIES } from "./_config.js";
import Stripe from "stripe";

export default async function handler(req, res) {
  const SECRET_KEY = process.env.STRIPE_SECRET_KEY;

  if (!SECRET_KEY) {
    res.status(500).json({
      error: "STRIPE_SECRET_KEY non configurata. Vai su Vercel -> Project Settings -> Environment Variables.",
    });
    return;
  }

  const property = req.query.property;
  const cfg = PROPERTIES[property];

  if (!cfg) {
    res.status(400).json({ error: `Proprietà sconosciuta: ${property}` });
    return;
  }

  const stripe = new Stripe(SECRET_KEY);

  try {
    // Se esiste già un accountId salvato per questa proprietà, riusiamo quello
    // invece di crearne uno nuovo (evita account duplicati per errore).
    let accountId = cfg.stripeAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "IT",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
      });
      accountId = account.id;
    }

    const origin = `https://${req.headers.host}`;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/api/stripe-onboard?property=${property}`,
      return_url: `${origin}/index.html`,
      type: "account_onboarding",
    });

    res.status(200).json({
      property,
      accountId,
      onboardingUrl: accountLink.url,
      note: accountId === cfg.stripeAccountId
        ? "Account già esistente, riusato."
        : "Nuovo account creato: copia questo accountId in _config.js -> stripeAccountId per questa proprietà.",
    });
  } catch (err) {
    res.status(500).json({ error: "Errore Stripe", details: err.message });
  }
}
