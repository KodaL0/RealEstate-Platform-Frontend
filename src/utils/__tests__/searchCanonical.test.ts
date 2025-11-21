import { describe, expect, it } from "vitest";

import {
  CANONICAL_DEFAULTS,
  decodeCanonicalPath,
  decodeLegacyQuery,
  encodeCanonicalPath,
  encodeCanonicalSegments,
  type SearchFilterState,
} from "../searchCanonical";

const BASE_FILTERS: Required<SearchFilterState> = {
  location: "Limassol",
  country: "Cyprus",
  minPrice: "100000",
  maxPrice: "300000",
  propertyType: "apartment",
  bedrooms: "2+",
  bathrooms: "Any",
  amenities: ["pool", "parking"],
};

describe("searchCanonical", () => {
  it("round-trips full filter state with extras", () => {
    const path = encodeCanonicalPath("buy", BASE_FILTERS, {
      sort: "price-desc",
      page: 3,
      results: 120,
    });

    const slug = path.replace("/buy/", "");
    const decoded = decodeCanonicalPath(slug);

    expect(decoded.filters).toMatchObject({
      ...BASE_FILTERS,
      bathrooms: CANONICAL_DEFAULTS.bathrooms,
    });
    expect(decoded.extras.sort).toBe("price-desc");
    expect(decoded.extras.page).toBe(3);
    expect(decoded.extras.results).toBe(120);

    const canonical = encodeCanonicalPath("buy", decoded.filters, {
      sort: decoded.extras.sort,
      page: decoded.extras.page,
      results: decoded.extras.results,
    });
    expect(canonical).toBe(path);
  });

  it("falls back gracefully for unknown property types and countries", () => {
    const filters: SearchFilterState = {
      ...BASE_FILTERS,
      propertyType: "castle",
      country: "Atlantis",
    };

    const segments = encodeCanonicalSegments(filters, {});
    expect(segments[0]).toBe("all");
    expect(segments[2]).toBe("any");

    const decoded = decodeCanonicalPath(segments.join("/"));
    expect(decoded.filters.country).toBe(CANONICAL_DEFAULTS.country);
    expect(decoded.filters.propertyType).toBe(CANONICAL_DEFAULTS.propertyType);
  });

  it("drops invalid amenity identifiers", () => {
    const filters: SearchFilterState = {
      ...BASE_FILTERS,
      amenities: ["pool", "invalid", "parking"],
    };

    const segments = encodeCanonicalSegments(filters, {});
    const amenitiesIdx = segments.indexOf("amenities");
    expect(amenitiesIdx).toBeGreaterThan(-1);
    expect(segments[amenitiesIdx + 1]).toBe("parking,pool");

    const decoded = decodeCanonicalPath(segments.join("/"));
    expect(decoded.filters.amenities).toEqual(["parking", "pool"]);
  });

  it("treats malformed prices as unset", () => {
    const filters: SearchFilterState = {
      ...BASE_FILTERS,
      minPrice: "100k??",
      maxPrice: "",
    };

    const segments = encodeCanonicalSegments(filters, {});
    const priceSegment = segments.find((segment) => segment.startsWith("price-"));
    expect(priceSegment).toBeUndefined();

    const decoded = decodeCanonicalPath(segments.join("/"));
    expect(decoded.filters.minPrice).toBe("");
    expect(decoded.filters.maxPrice).toBe("");
  });

  it("decodes legacy query parameters before canonicalising", () => {
    const params = new URLSearchParams();
    params.set("Location", "Limassol");
    params.set("BEDS", "3+");
    params.set("amenities", "pool,invalid");
    params.set("sort", "price-asc");

    const normalized = new URLSearchParams();
    params.forEach((value, key) => {
      normalized.set(key.toLowerCase(), value);
    });

    const decodedLegacy = decodeLegacyQuery(normalized);
    expect(decodedLegacy.filters.location).toBe("Limassol");
    expect(decodedLegacy.filters.bedrooms).toBe("3+");
    expect(decodedLegacy.filters.amenities).toEqual(["pool"]);

    const encoded = encodeCanonicalPath("rent", decodedLegacy.filters, {
      sort: decodedLegacy.extras.sort,
      page: decodedLegacy.extras.page,
    });

    const slug = encoded.replace("/rent/", "");
    const decoded = decodeCanonicalPath(slug);
    expect(decoded.filters.location).toBe("Limassol");
    expect(decoded.filters.bedrooms).toBe("3+");
    expect(decoded.filters.amenities).toEqual(["pool"]);
    expect(decoded.extras.sort).toBe("price-asc");
  });
});
