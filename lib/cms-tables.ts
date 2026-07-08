export const LISTING_SOURCE_TABLE: Record<string, string | null> = {

  // ── Travel ────────────────────────────────────────────────────────────────
  Destinations:   "ac_destinations",
  Hotels:         "ac_listings_travel",
  Tours:          "ac_listings_travel",
  Packages:       "ac_listings_travel",
  Visas:          "ac_listings_travel",
  Transfers:      "ac_listings_travel",
  Promotions:     "ac_listings_travel",
  Meetings:       "ac_listings_travel",
  Corporate:      "ac_listings_travel",
  Shop:           "ac_listings_travel",

  // ── Real Estate ───────────────────────────────────────────────────────────
  Houses:         "ac_listings_realestate",
  Apartments:     "ac_listings_realestate",
  Villas:         "ac_listings_realestate",
  Commercial:     "ac_listings_realestate",
  Lands:          "ac_listings_realestate",
  Rentals:        "ac_listings_realestate",

  // ── B2C / Procurement ─────────────────────────────────────────────────────
  Products:       "ac_listings_b2c",
  Suppliers:      "ac_listings_b2c",
  Services:       "ac_listings_b2c",

  // ── Healthcare ────────────────────────────────────────────────────────────
  Doctors:        "ac_listings_healthcare",
  Treatments:     "ac_listings_healthcare",
  Clinics:        "ac_listings_healthcare",

  // ── SaaS / Tech ───────────────────────────────────────────────────────────
  Plans:          "ac_listings_saas",
  Features:       "ac_listings_saas",
  Integrations:   "ac_listings_saas",
  "Case Studies": "ac_listings_saas",
  Resources:      "ac_listings_saas",

  // ── Retail ────────────────────────────────────────────────────────────────
  Bundles:        "ac_listings_retail",
  Deals:          "ac_listings_retail",
  Collections:    "ac_listings_retail",

  // ── Finance ───────────────────────────────────────────────────────────────
  "Investment Products": "ac_listings_finance",
  "Loan Types":          "ac_listings_finance",
  "Insurance Plans":     "ac_listings_finance",
  Funds:                 "ac_listings_finance",
  Reports:               "ac_listings_finance",

  // ── Automotive ────────────────────────────────────────────────────────────
  Vehicles:       "ac_listings_automotive",
  Parts:          "ac_listings_automotive",
  Fleet:          "ac_listings_automotive",
  Wraps:          "ac_listings_automotive",
};

export const SOURCE_TABLE_NAME_COL: Record<string, string> = {
  at_listings_travel:     "title",
  at_listings_realestate: "title",
  at_listings_healthcare: "title",
  at_listings_saas:       "title",
  at_listings_retail:     "title",
  at_listings_finance:    "title",
  at_listings_automotive: "title",
  at_listings_b2c:        "title",
  at_destinations:        "title",
};
