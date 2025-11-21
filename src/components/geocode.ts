// src/utils/geocode.ts

/**
 * Forward-geocodes a human-readable address into latitude/longitude
 * using Nominatim’s “search” endpoint.
 *
 * @param address  The address string to look up (e.g. "1600 Amphitheatre Parkway, Mountain View, CA")
 * @param email    Optional email to include per Nominatim usage policy
 * @returns        An object with `lat` and `lng` as numbers
 */
export async function geocodeAddress(
  address: string,
  email?: string,
): Promise<{ lat: number; lng: number }> {
  const params = new URLSearchParams({
    format: "json",
    q: address,
    addressdetails: "1",
    ...(email ? { email } : {}),
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
  if (!res.ok) {
    throw new Error(`Geocoding request failed: ${res.status}`);
  }

  const places: Array<{ lat: string; lon: string }> = await res.json();
  if (!places.length) {
    throw new Error("No geocoding results");
  }

  return {
    lat: parseFloat(places[0].lat),
    lng: parseFloat(places[0].lon),
  };
}
