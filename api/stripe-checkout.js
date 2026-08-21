// /api/stripe-checkout.js
// Crea una sessione di pagamento Stripe Checkout per una prenotazione, con smistamento
// automatico di parte dell'importo all'account del proprietario (Stripe Connect).
//
// USO: POST /api/stripe-checkout
// Corpo: { property, checkin, checkout, guests, totalAmount, propertyName }
// Risposta: { url: "https://checkout.stripe.com/..." } -> il sito reindirizza l'ospite lì

import { PROPERTIES } from "./_config.js";
import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Usa POST" });
    return;
  }

  const SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!SECRET_KEY) {
    res.status(500).json({ error: "STRIPE_SECRET_KEY non configurata." });
    return;
  }

  const { property, checkin, checkout, guests, totalAmount, propertyName } = req.body || {};
  const cfg = PROPERTIES[property];

  if (!cfg) {
    res.status(400).json({ error: `Proprietà sconosciuta: ${property}` });
    return;
  }
  if (!cfg.stripeAccountId) {
    res.status(400).json({
      error: `Il proprietario di questa proprietà non ha ancora completato la verifica Stripe. Usa /api/stripe-onboard?property=${property} per generare il link.`,
    });
    return;
  }
  if (!totalAmount || totalAmount <= 0) {
    res.status(400).json({ error: "Importo totale mancante o non valido." });
    return;
  }

  const stripe = new Stripe(SECRET_KEY);
  const amountCents = Math.round(totalAmount * 100);
  const feeCents = Math.round(amountCents * (cfg.commissionPercent / 100));

  try {
    const origin = `https://${req.headers.host}`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${propertyName || property} — ${checkin} → ${checkout}`,
              description: `${guests} ospiti`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: feeCents, // trattenuto da Immobilia
        transfer_data: {
          destination: cfg.stripeAccountId, // il resto va al proprietario
        },
      },
      success_url: `${origin}/${property}.html?booking=success`,
      cancel_url: `${origin}/${property}.html?booking=cancelled`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: "Errore nella creazione del pagamento", details: err.message });
  }
}
