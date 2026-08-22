// /api/booking-confirmation.js
// Recupera i dettagli reali di una sessione di pagamento completata, direttamente da Stripe.
// Uso: GET /api/booking-confirmation?session_id=cs_test_...

import Stripe from "stripe";

export default async function handler(req, res) {
  const SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!SECRET_KEY) {
    res.status(500).json({ error: "STRIPE_SECRET_KEY non configurata." });
    return;
  }

  const { session_id } = req.query;
  if (!session_id) {
    res.status(400).json({ error: "session_id mancante" });
    return;
  }

  const stripe = new Stripe(SECRET_KEY);

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      res.status(200).json({ paid: false });
      return;
    }

    const meta = session.metadata || {};
    res.status(200).json({
      paid: true,
      property: meta.property,
      propertyName: meta.propertyName,
      checkin: meta.checkin,
      checkout: meta.checkout,
      guests: meta.guests,
      payMode: meta.payMode,
      fullTotal: parseFloat(meta.fullTotal || "0"),
      amountPaid: parseFloat(meta.amountPaid || "0"),
      hasPet: meta.hasPet === "true",
      currency: session.currency,
      customerEmail: session.customer_details?.email || null,
    });
  } catch (err) {
    res.status(500).json({ error: "Impossibile recuperare la prenotazione", details: err.message });
  }
}
