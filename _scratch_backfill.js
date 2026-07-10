const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const REAL_ENV = "c:\\Users\\ASUS\\Downloads\\PROJECTS\\AT-TravQuest-NEXT\\.env.local";
const raw = fs.readFileSync(REAL_ENV, "utf8");
const env = {};
for (const line of raw.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function toArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string" && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [val];
    } catch {
      return [val];
    }
  }
  return [];
}

// Columns shared 1:1 by name between the legacy tables and ac_listings_travel.
const COMMON_FIELDS = [
  "title", "subtitle", "description", "highlights", "itinerary", "other_info",
  "additional_info", "cost_inclusions", "cost_exclusions", "terms_conditions",
  "price", "original_price", "location", "status", "is_recom", "is_featured",
  "sort_order", "created_at", "updated_at", "client_name", "restaurants",
];

const CATEGORY_FIELDS = {
  Apartments: [
    "apartment_category", "apartment_type", "bedrooms", "bathrooms", "sqft",
    "floor_number", "building_name", "min_stay_nights", "max_guests", "parking",
  ],
  Transfers: [
    "transfer_type", "vehicle_type", "capacity", "pickup_location",
    "dropoff_location", "flight_tracking", "meet_and_greet", "luggage_limit",
  ],
};

function buildRow(legacyRow, listingType) {
  const row = {
    company: "TravQuest",
    industry: "travel",
    listing_type: listingType,
    ref_id: String(legacyRow.id),
    name: legacyRow.title,
  };
  for (const f of COMMON_FIELDS) {
    if (f in legacyRow) row[f] = legacyRow[f] ?? null;
  }
  row.country = toArray(legacyRow.country);
  row.city = toArray(legacyRow.city);
  row.category = toArray(legacyRow.category);
  row.amenities = toArray(legacyRow.amenities);
  row.image_urls = toArray(legacyRow.image_urls);
  for (const f of CATEGORY_FIELDS[listingType]) {
    if (f in legacyRow) row[f] = legacyRow[f] ?? null;
  }
  return row;
}

async function migrate(legacyTable, listingType) {
  const { data: legacyRows, error } = await supabase.from(legacyTable).select("*").order("id");
  if (error) throw error;

  const { count: before } = await supabase
    .from("ac_listings_travel")
    .select("id", { count: "exact", head: true })
    .eq("listing_type", listingType);

  const rows = legacyRows.map((r) => buildRow(r, listingType));
  const { data: inserted, error: insertError } = await supabase
    .from("ac_listings_travel")
    .insert(rows)
    .select("id, ref_id, title, listing_type");

  if (insertError) throw insertError;

  const { count: after } = await supabase
    .from("ac_listings_travel")
    .select("id", { count: "exact", head: true })
    .eq("listing_type", listingType);

  console.log(`\n=== ${legacyTable} -> ac_listings_travel[${listingType}] ===`);
  console.log(`before: ${before}, inserted: ${inserted.length}, after: ${after}`);
  console.log(inserted);
}

(async () => {
  await migrate("apartments", "Apartments");
  await migrate("airports", "Transfers");
})().catch((e) => {
  console.error("MIGRATION FAILED:", e);
  process.exit(1);
});
