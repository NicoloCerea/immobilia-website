// /api/_config.js
// Configurazione centrale: per ogni proprietà, il link iCal (SmartPMS), l'ID PriceLabs
// e le regole di pricing (pulizia + supplemento ospiti extra).
// I file che iniziano con "_" non vengono trattati come endpoint da Vercel: è solo un modulo condiviso.
//
// NOTA: questi valori vivono qui per ora (si modificano cambiando questo file + push).
// In futuro possiamo spostarli in un pannello web modificabile senza toccare il codice.

export const PROPERTIES = {
  "sertorelli-26": {
    icalUrl:
      "https://pms-api.smartness.com/api/3.0/room-types/generate-ics/6d6f6476306a587a696a2f795a36446d462b45624e773d3d.ics",
    listingId: "145903___14556",
    pms: "ciaobooking",
    cleaningFeeBase: 50,
    cleaningFeePerGuest: 7,
    baseOccupancy: 2,
    extraGuestFeePerNight: 10,
  },
  "fumarogo-100d": {
    icalUrl:
      "https://pms-api.smartness.com/api/3.0/room-types/generate-ics/646964454d48744d794d6756724843514f2f425a74773d3d.ics",
    listingId: "147076___17281",
    pms: "ciaobooking",
    cleaningFeeBase: 50,
    cleaningFeePerGuest: 7,
    baseOccupancy: 2,
    extraGuestFeePerNight: 10,
  },
  "monte-reit-7": {
    icalUrl:
      "https://pms-api.smartness.com/api/3.0/room-types/generate-ics/76614d6c464a76505a6c536c374f6668457571386f513d3d.ics",
    listingId: "146799___16661",
    pms: "ciaobooking",
    cleaningFeeBase: 50,
    cleaningFeePerGuest: 7,
    baseOccupancy: 2,
    extraGuestFeePerNight: 10,
  },
  "livigno-cantoni": {
    icalUrl:
      "https://pms-api.smartness.com/api/3.0/room-types/generate-ics/667745754c673461424d494177666f65333864476c513d3d.ics",
    listingId: "152559___27775",
    pms: "ciaobooking",
    cleaningFeeBase: 50,
    cleaningFeePerGuest: 0,
    baseOccupancy: 2,
    extraGuestFeePerNight: 10,
  },
  "livigno-river": {
    icalUrl:
      "https://pms-api.smartness.com/api/3.0/room-types/generate-ics/43454d636c7265476459325a384e69487348452f44773d3d.ics",
    listingId: "152560___27778",
    pms: "ciaobooking",
    cleaningFeeBase: 50,
    cleaningFeePerGuest: 0,
    baseOccupancy: 2,
    extraGuestFeePerNight: 10,
  },
  "livigno-toila": {
    icalUrl:
      "https://pms-api.smartness.com/api/3.0/room-types/generate-ics/7a426236575a4f654d3955395a644a4d37304e792b513d3d.ics",
    listingId: "152557___27773",
    pms: "ciaobooking",
    cleaningFeeBase: 50,
    cleaningFeePerGuest: 0,
    baseOccupancy: 2,
    extraGuestFeePerNight: 10,
  },
};
