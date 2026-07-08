export type FlightOffer = {
  id: string;
  numberOfBookableSeats: number;
  price: {
    total: string;
    currency: string;
  };
  validatingAirlineCodes?: string[];
  itineraries: {
    duration: string;
    segments: {
      departure: { iataCode: string; at: string };
      arrival: { iataCode: string; at: string };
      carrierCode: string;
      number: string;
      aircraft: { code: string };
    }[];
  }[];
  travelerPricings?: {
    fareDetailsBySegment?: {
      cabin?: string;
    }[];
  }[];
};

type SearchParams = {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  max?: number;
};

export async function searchFlights(params: SearchParams): Promise<FlightOffer[]> {
  const qs = new URLSearchParams({
    originLocationCode: params.originLocationCode,
    destinationLocationCode: params.destinationLocationCode,
    departureDate: params.departureDate,
    adults: String(params.adults),
    max: String(params.max ?? 15),
  });
  if (params.returnDate) qs.set("returnDate", params.returnDate);
  if (params.children) qs.set("children", String(params.children));
  if (params.infants) qs.set("infants", String(params.infants));

  const res = await fetch(`/travel/api/flights?${qs}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to fetch flights.");
  }

  return data as FlightOffer[];
}

export function parseDuration(iso: string): string {
  const h = iso.match(/(\d+)H/)?.[1];
  const m = iso.match(/(\d+)M/)?.[1];
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  if (m) return `${m}m`;
  return iso;
}

export function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDateShort(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
