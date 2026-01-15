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

/**
 * Structured address components for geocoding
 */
export interface StructuredAddress {
  street?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country?: string;
}

/**
 * Geocodes a property using multiple fallback strategies:
 * 1. Use provided coordinates if available
 * 2. Try geocoding the location string
 * 3. Try structured address (street + postal_code + city + country)
 * 4. Try postal_code + country
 * 5. Try city + country
 *
 * @param location - The location string (legacy field)
 * @param structuredAddress - Structured address components
 * @param email - Optional email for Nominatim usage policy
 * @returns Coordinates or null if all attempts fail
 */
export async function geocodePropertyLocation(
  location?: string,
  structuredAddress?: StructuredAddress,
  email?: string,
): Promise<{ lat: number; lng: number } | null> {
  const errors: string[] = [];

  // Strategy 1: Try location string first
  if (location && location.trim()) {
    try {
      console.log("Attempting geocoding with location string:", location);
      return await geocodeAddress(location, email);
    } catch (err) {
      errors.push(`Location string failed: ${err}`);
      console.warn("Geocoding with location string failed:", err);
    }
  }

  // Strategy 2: Try full structured address (street + postal_code + city + country)
  if (structuredAddress) {
    const { street, postal_code, city, region, country } = structuredAddress;

    // Try: street + postal_code + city + country
    if (street && postal_code && city && country) {
      try {
        const fullAddress = `${street}, ${postal_code}, ${city}, ${country}`;
        console.log("Attempting geocoding with full structured address:", fullAddress);
        return await geocodeAddress(fullAddress, email);
      } catch (err) {
        errors.push(`Full structured address failed: ${err}`);
        console.warn("Geocoding with full structured address failed:", err);
      }
    }

    // Try: street + city + country
    if (street && city && country) {
      try {
        const addressWithoutPostal = `${street}, ${city}, ${country}`;
        console.log("Attempting geocoding with street + city + country:", addressWithoutPostal);
        return await geocodeAddress(addressWithoutPostal, email);
      } catch (err) {
        errors.push(`Street + city + country failed: ${err}`);
        console.warn("Geocoding with street + city + country failed:", err);
      }
    }

    // Try: postal_code + city + country
    if (postal_code && city && country) {
      try {
        const postalCityCountry = `${postal_code}, ${city}, ${country}`;
        console.log("Attempting geocoding with postal_code + city + country:", postalCityCountry);
        return await geocodeAddress(postalCityCountry, email);
      } catch (err) {
        errors.push(`Postal code + city + country failed: ${err}`);
        console.warn("Geocoding with postal_code + city + country failed:", err);
      }
    }

    // Try: postal_code + country (good for general area)
    if (postal_code && country) {
      try {
        const postalCountry = `${postal_code}, ${country}`;
        console.log("Attempting geocoding with postal_code + country:", postalCountry);
        return await geocodeAddress(postalCountry, email);
      } catch (err) {
        errors.push(`Postal code + country failed: ${err}`);
        console.warn("Geocoding with postal_code + country failed:", err);
      }
    }

    // Try: city + region + country
    if (city && region && country) {
      try {
        const cityRegionCountry = `${city}, ${region}, ${country}`;
        console.log("Attempting geocoding with city + region + country:", cityRegionCountry);
        return await geocodeAddress(cityRegionCountry, email);
      } catch (err) {
        errors.push(`City + region + country failed: ${err}`);
        console.warn("Geocoding with city + region + country failed:", err);
      }
    }

    // Try: city + country (last resort for approximate location)
    if (city && country) {
      try {
        const cityCountry = `${city}, ${country}`;
        console.log("Attempting geocoding with city + country:", cityCountry);
        return await geocodeAddress(cityCountry, email);
      } catch (err) {
        errors.push(`City + country failed: ${err}`);
        console.warn("Geocoding with city + country failed:", err);
      }
    }
  }

  // All strategies failed
  console.error("All geocoding strategies failed:", errors);
  return null;
}
