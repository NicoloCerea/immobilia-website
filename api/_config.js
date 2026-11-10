import { TOILA_PRICES, CANTONI_PRICES, FRANZ1_PRICES, FRANZ2_PRICES, FRANZ3_PRICES } from "./_manualPrices.js";
// /api/_config.js
// Configurazione centrale: per ogni proprietà, il link iCal (SmartPMS), l'ID PriceLabs
// e le regole di pricing (pulizia + supplemento ospiti extra).
// I file che iniziano con "_" non vengono trattati come endpoint da Vercel: è solo un modulo condiviso.
//
// NOTA: questi valori vivono qui per ora (si modificano cambiando questo file + push).
// In futuro possiamo spostarli in un pannello web modificabile senza toccare il codice.

// Sconto applicato a TUTTI i prezzi letti da PriceLabs (calendario, ricerca, totale).
// Per rimuoverlo o cambiarlo, modifica solo questo numero.
export const GLOBAL_DISCOUNT_PERCENT = 19;

// Regola di soggiorno: arrivo e partenza solo di sabato (6 = sabato), minimo 7 notti, tutto l'anno.
// Applicata a Franz 1-3, River, Toilà, Cantoni. Per toglierla da una proprietà basta cancellare la riga "stayRule".
export const SATURDAY_WEEK_RULE = { minNights: 7, checkinDow: 6, checkoutDow: 6 };

export const PROPERTIES = {
  "sertorelli-26": {
    depositOnly: true, // si paga solo l'acconto del 25% online, il saldo in struttura
    icalUrl:
      "https://pms-api.smartness.com/api/3.0/room-types/generate-ics/6d6f6476306a587a696a2f795a36446d462b45624e773d3d.ics",
    listingId: "145903___14556",
    pms: "ciaobooking",
    cleaningFeeBase: 50,
    cleaningFeePerGuest: 7, // usato solo se manca cleaningFeeByGuests (fallback)
    cleaningFeeByGuests: { 1: 14, 2: 14, 3: 28, 4: 28, 5: 42 }, // sovrapprezzo pulizia per numero di ospiti (oltre passa il 5)
    baseOccupancy: 4,
    extraGuestFeePerNight: 15,
    petFee: 30, // supplemento fisso se si porta un animale
    stripeAccountId: null,
    commissionPercent: 15,
    platformOwned: true, // proprietà di Immobilia stessa: nessuno smistamento, resta sull'account principale
  },
  "fumarogo-100d": {
    depositOnly: true, // si paga solo l'acconto del 25% online, il saldo in struttura
    icalUrl:
      "https://pms-api.smartness.com/api/3.0/room-types/generate-ics/646964454d48744d794d6756724843514f2f425a74773d3d.ics",
    listingId: "147076___17281",
    pms: "ciaobooking",
    cleaningFeeBase: 50,
    cleaningFeePerGuest: 7, // usato solo se manca cleaningFeeByGuests (fallback)
    cleaningFeeByGuests: { 1: 14, 2: 14, 3: 21, 4: 28, 5: 35, 6: 42, 7: 49 }, // sovrapprezzo pulizia per numero di ospiti
    baseOccupancy: 4,
    extraGuestFeePerNight: 15,
    petFee: 30, // supplemento fisso se si porta un animale
    stripeAccountId: null, // si popola dopo l'onboarding del proprietario (vedi /api/stripe-onboard)
    commissionPercent: 15, // % trattenuta da Immobilia come commissione di gestione
    platformOwned: true, // TEMPORANEO: il proprietario non ha ancora completato Stripe, i pagamenti restano sull'account principale per ora
  },
  "monte-reit-7": {
    depositOnly: true, // si paga solo l'acconto del 25% online, il saldo in struttura
    icalUrl:
      "https://pms-api.smartness.com/api/3.0/room-types/generate-ics/76614d6c464a76505a6c536c374f6668457571386f513d3d.ics",
    listingId: "146799___16661",
    pms: "ciaobooking",
    cleaningFeeBase: 50,
    cleaningFeePerGuest: 7, // usato solo se manca cleaningFeeByGuests (fallback)
    cleaningFeeByGuests: { 1: 14, 2: 14, 3: 28, 4: 28, 5: 35 }, // sovrapprezzo pulizia per numero di ospiti
    baseOccupancy: 4,
    extraGuestFeePerNight: 15,
    petFee: 30, // supplemento fisso se si porta un animale
    stripeAccountId: null, // si popola dopo l'onboarding del proprietario (vedi /api/stripe-onboard)
    commissionPercent: 15, // % trattenuta da Immobilia come commissione di gestione
    platformOwned: true, // TEMPORANEO: il proprietario non ha ancora completato Stripe, i pagamenti restano sull'account principale per ora
  },
  "livigno-cantoni": {
    depositOnly: true, // si paga solo l'acconto del 25% online, il saldo in struttura
    stayRule: SATURDAY_WEEK_RULE, // sabato-sabato, minimo 7 notti
    icalUrl:
      "https://pms-api.smartness.com/api/3.0/room-types/generate-ics/667745754c673461424d494177666f65333864476c513d3d.ics",
    listingId: "152559___27775",
    pms: "ciaobooking",
    manualPrices: CANTONI_PRICES, // prezzi fissi da Airbnb (La Baita tra le Alpi) -15,5%
    manualMinStay: 7,
    cleaningFeeBase: 50,
    cleaningFeePerGuest: 0,
    baseOccupancy: 2,
    extraGuestFeePerNight: 10,
    petFee: 30, // supplemento fisso se si porta un animale
    stripeAccountId: null, // si popola dopo l'onboarding del proprietario (vedi /api/stripe-onboard)
    commissionPercent: 15, // % trattenuta da Immobilia come commissione di gestione
    platformOwned: true, // TEMPORANEO: il proprietario non ha ancora completato Stripe, i pagamenti restano sull'account principale per ora
  },
  "livigno-river": {
    depositOnly: true, // si paga solo l'acconto del 25% online, il saldo in struttura
    stayRule: SATURDAY_WEEK_RULE, // sabato-sabato, minimo 7 notti
    icalUrl:
      "https://pms-api.smartness.com/api/3.0/room-types/generate-ics/43454d636c7265476459325a384e69487348452f44773d3d.ics",
    listingId: "152560___27778",
    pms: "ciaobooking",
    cleaningFeeBase: 50,
    cleaningFeePerGuest: 0,
    baseOccupancy: 2,
    extraGuestFeePerNight: 10,
    petFee: 30, // supplemento fisso se si porta un animale
    stripeAccountId: null, // si popola dopo l'onboarding del proprietario (vedi /api/stripe-onboard)
    commissionPercent: 15, // % trattenuta da Immobilia come commissione di gestione
    platformOwned: true, // TEMPORANEO: il proprietario non ha ancora completato Stripe, i pagamenti restano sull'account principale per ora
  },
  "livigno-toila": {
    depositOnly: true, // si paga solo l'acconto del 25% online, il saldo in struttura
    stayRule: SATURDAY_WEEK_RULE, // sabato-sabato, minimo 7 notti
    icalUrl:
      "https://pms-api.smartness.com/api/3.0/room-types/generate-ics/7a426236575a4f654d3955395a644a4d37304e792b513d3d.ics",
    listingId: "152557___27773",
    pms: "ciaobooking",
    manualPrices: TOILA_PRICES, // prezzi fissi da Airbnb -15,5%: niente PriceLabs né sconto globale
    manualMinStay: 7,
    cleaningFeeBase: 50,
    cleaningFeePerGuest: 0,
    baseOccupancy: 2,
    extraGuestFeePerNight: 10,
    petFee: 30, // supplemento fisso se si porta un animale
    stripeAccountId: null, // si popola dopo l'onboarding del proprietario (vedi /api/stripe-onboard)
    commissionPercent: 15, // % trattenuta da Immobilia come commissione di gestione
    platformOwned: true, // TEMPORANEO: il proprietario non ha ancora completato Stripe, i pagamenti restano sull'account principale per ora
  },
  "baita-franz-1-mansarda": {
    depositOnly: true, // si paga solo l'acconto del 25% online, il saldo in struttura
    stayRule: SATURDAY_WEEK_RULE, // sabato-sabato, minimo 7 notti
    manualPrices: FRANZ1_PRICES, // prezzi settimanali dal proprietario +15%, divisi per 7 notti
    manualMinStay: 7,
    icalUrl:
      "https://pms-api.smartness.com/api/3.0/room-types/generate-ics/7759414e5634764b644a75475350613448636d6e2f513d3d.ics",
    // Prezzi fissi settimanali (vedi _manualPrices.js); disponibilità dall'iCal.
    cleaningFeeBase: 0,
    cleaningFeePerGuest: 0,
    baseOccupancy: 4,
    extraGuestFeePerNight: 0,
    petFee: 0,
    stripeAccountId: null,
    commissionPercent: 15,
    platformOwned: true,
  },
  "baita-franz-2": {
    depositOnly: true, // si paga solo l'acconto del 25% online, il saldo in struttura
    stayRule: SATURDAY_WEEK_RULE, // sabato-sabato, minimo 7 notti
    manualPrices: FRANZ2_PRICES, // prezzi settimanali dal proprietario +15%, divisi per 7 notti
    manualMinStay: 7,
    icalUrl:
      "https://pms-api.smartness.com/api/3.0/room-types/generate-ics/326444442b684a7a416a3544554e332f4b486d6234513d3d.ics",
    // Prezzi fissi settimanali (vedi _manualPrices.js); disponibilità dall'iCal.
    cleaningFeeBase: 0,
    cleaningFeePerGuest: 0,
    baseOccupancy: 4,
    extraGuestFeePerNight: 0,
    petFee: 0,
    stripeAccountId: null,
    commissionPercent: 15,
    platformOwned: true,
  },
  "baita-franz-3": {
    depositOnly: true, // si paga solo l'acconto del 25% online, il saldo in struttura
    stayRule: SATURDAY_WEEK_RULE, // sabato-sabato, minimo 7 notti
    manualPrices: FRANZ3_PRICES, // prezzi settimanali dal proprietario +15%, divisi per 7 notti
    manualMinStay: 7,
    icalUrl:
      "https://pms-api.smartness.com/api/3.0/room-types/generate-ics/4c41687a672b527250333442577574496d33697330413d3d.ics",
    // Prezzi fissi settimanali (vedi _manualPrices.js); disponibilità dall'iCal.
    cleaningFeeBase: 0,
    cleaningFeePerGuest: 0,
    baseOccupancy: 4,
    extraGuestFeePerNight: 0,
    petFee: 0,
    stripeAccountId: null,
    commissionPercent: 15,
    platformOwned: true,
  },
  "chalet-zanchetta": {
    icalUrl:
      "https://pms-api.smartness.com/api/3.0/room-types/generate-ics/6b644a3877317958764e62486b5768647a6b663759413d3d.ics",
    // Solo disponibilità (iCal): nessun listingId PriceLabs né prezzi, quindi NON compare nella ricerca/prenotazione online.
    cleaningFeeBase: 50,
    cleaningFeePerGuest: 0,
    cleaningFeeByGuests: { 1: 15, 2: 15, 3: 22, 4: 29 }, // sovrapprezzo pulizia per numero di ospiti
    baseOccupancy: 2,
    extraGuestFeePerNight: 5, // dal 3° ospite
    petFee: 0,
    stripeAccountId: null,
    commissionPercent: 15,
    platformOwned: true,
  },
};
