import { AMENITIES, COUNTRY_OPTIONS, PROPERTY_TYPES } from "../types";

export type ListingType = "buy" | "rent";

export interface SearchFilterState {
  location?: string;
  country?: string;
  minPrice?: string;
  maxPrice?: string;
  propertyType?: string;
  bedrooms?: string;
  bathrooms?: string;
  amenities?: string[];
}

export interface CanonicalExtras {
  sort?: string;
  page?: number;
  results?: number;
}

export interface DecodedCanonical {
  filters: Required<SearchFilterState>;
  extras: {
    sort: string;
    page: number;
    results?: number;
  };
  segments: string[];
}

export const CANONICAL_DEFAULTS = {
  country: "All",
  propertyType: "Any",
  bedrooms: "Any",
  bathrooms: "Any",
  sort: "recommended",
  page: 1,
} as const;

const COUNTRY_SLUG_OVERRIDES: Record<string, string> = {
  cyprus: "cy",
  greece: "gr",
};

const COUNTRY_VALUE_TO_SLUG = new Map<string, string>();
const COUNTRY_SLUG_TO_LABEL = new Map<string, string>();

COUNTRY_OPTIONS.forEach((option) => {
  const label = option.value.trim();
  const lower = label.toLowerCase();
  const overrideSlug = COUNTRY_SLUG_OVERRIDES[lower];
  const legacySlug = slugify(label, lower);
  const slug = overrideSlug ?? legacySlug;

  COUNTRY_VALUE_TO_SLUG.set(lower, slug);
  COUNTRY_SLUG_TO_LABEL.set(slug, label);
  COUNTRY_SLUG_TO_LABEL.set(legacySlug, label); // legacy `country-cyprus`
});

COUNTRY_VALUE_TO_SLUG.set("all", "all");
COUNTRY_SLUG_TO_LABEL.set("all", "All");
COUNTRY_SLUG_TO_LABEL.set("x", "All");

const PROPERTY_TYPE_SET = new Set<string>(PROPERTY_TYPES.map((type) => type.value));
const VALID_AMENITY_IDS = new Set<string>(AMENITIES.map((amenity) => amenity.id));

const BED_BATH_LABEL_TO_KEY: Record<string, string> = {
  Any: "any",
  "1+": "1plus",
  "2+": "2plus",
  "3+": "3plus",
  "4+": "4plus",
  "5+": "5plus",
};

const BED_BATH_KEY_TO_LABEL: Record<string, string> = {
  any: "Any",
  x: "Any",
  "1plus": "1+",
  "2plus": "2+",
  "3plus": "3+",
  "4plus": "4+",
  "5plus": "5+",
};

function slugify(input: string, fallback = "any"): string {
  if (!input) return fallback;
  const normalized = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || fallback;
}

function unslugify(input: string): string {
  if (!input || input === "any" || input === "x") return "";
  return input
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeCountry(input?: string): { label: string; slug: string } {
  if (!input || input === "All") {
    return { label: "All", slug: "all" };
  }

  const normalized = input.trim();
  const lower = normalized.toLowerCase();
  const slug = COUNTRY_VALUE_TO_SLUG.get(lower) ?? slugify(normalized, "all");
  const mappedLabel = COUNTRY_SLUG_TO_LABEL.get(slug);

  if (mappedLabel) {
    return { label: mappedLabel, slug };
  }

  // Unknown country -> default to All to avoid breaking URLs
  return { label: CANONICAL_DEFAULTS.country, slug: "all" };
}

function decodeCountrySegment(segment?: string): string {
  if (!segment || segment === "all" || segment === "x") {
    return CANONICAL_DEFAULTS.country;
  }

  const mapped = COUNTRY_SLUG_TO_LABEL.get(segment);
  if (mapped) {
    return mapped;
  }

  const unslugged = unslugify(segment);
  if (!unslugged) {
    return CANONICAL_DEFAULTS.country;
  }

  // Unknown country slug – treat as freeform label but avoid empty string
  return unslugged;
}

function normalizePropertyType(input?: string): { value: string; slug: string } {
  if (!input || input === "Any") {
    return { value: "Any", slug: "any" };
  }

  if (!PROPERTY_TYPE_SET.has(input)) {
    return { value: CANONICAL_DEFAULTS.propertyType, slug: "any" };
  }

  return { value: input, slug: slugify(input, input) };
}

function decodePropertyTypeSegment(segment?: string): string {
  if (!segment || segment === "any" || segment === "x") {
    return CANONICAL_DEFAULTS.propertyType;
  }
  return PROPERTY_TYPE_SET.has(segment) ? segment : CANONICAL_DEFAULTS.propertyType;
}

function encodeBedsOrBaths(input?: string): string {
  if (!input) return "any";
  return BED_BATH_LABEL_TO_KEY[input] ?? "any";
}

function decodeBedsOrBaths(key?: string): string {
  if (!key) return "Any";
  return BED_BATH_KEY_TO_LABEL[key] ?? "Any";
}

function parsePriceNumeric(value?: string): number | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return undefined;

  if (/[^0-9km.]/.test(trimmed.replace(/[,\s€£$]/g, ""))) {
    return undefined;
  }

  if (trimmed.startsWith("-")) {
    return undefined;
  }

  if (/^\d+(?:\.\d+)?m$/.test(trimmed)) {
    return Math.round(parseFloat(trimmed.slice(0, -1)) * 1_000_000);
  }

  if (/^\d+(?:\.\d+)?k$/.test(trimmed)) {
    return Math.round(parseFloat(trimmed.slice(0, -1)) * 1_000);
  }

  const numeric = trimmed.replace(/[^0-9.]/g, "");
  if (!numeric) return undefined;

  const parsed = Number.parseFloat(numeric);
  if (Number.isNaN(parsed)) return undefined;
  return Math.round(parsed);
}

function formatPriceToken(value?: string): string {
  const numeric = parsePriceNumeric(value);
  if (numeric === undefined) return "x";

  if (numeric % 1_000_000 === 0 && numeric >= 1_000_000) {
    return `${numeric / 1_000_000}m`;
  }

  if (numeric % 1_000 === 0 && numeric >= 1_000) {
    return `${numeric / 1_000}k`;
  }

  return numeric.toString();
}

function parsePriceToken(token: string): string {
  if (!token || token === "x") return "";
  const lower = token.toLowerCase();

  if (/^\d+(?:\.\d+)?m$/.test(lower)) {
    return Math.round(parseFloat(lower.slice(0, -1)) * 1_000_000).toString();
  }

  if (/^\d+(?:\.\d+)?k$/.test(lower)) {
    return Math.round(parseFloat(lower.slice(0, -1)) * 1_000).toString();
  }

  const numeric = lower.replace(/[^0-9.]/g, "");
  if (!numeric) return "";

  const parsed = Number.parseFloat(numeric);
  if (Number.isNaN(parsed)) return "";
  return Math.round(parsed).toString();
}

function encodePriceSegment(minPrice?: string, maxPrice?: string): string | null {
  const minToken = formatPriceToken(minPrice);
  const maxToken = formatPriceToken(maxPrice);

  if (minToken === "x" && maxToken === "x") {
    return null;
  }

  return `price-${minToken}-${maxToken}`;
}

function decodePriceSegment(segment: string, filters: Required<SearchFilterState>): void {
  const [, minToken = "x", maxToken = "x"] = segment.split("-");
  const min = parsePriceToken(minToken);
  const max = parsePriceToken(maxToken);

  filters.minPrice = min;
  filters.maxPrice = max;
}

function encodeAmenitySegments(amenities?: string[]): string[] {
  if (!amenities || amenities.length === 0) return [];
  const unique = Array.from(
    new Set(
      amenities
        .map((amenity) => amenity.trim())
        .filter((amenity) => amenity.length > 0 && VALID_AMENITY_IDS.has(amenity)),
    ),
  );
  if (unique.length === 0) return [];
  unique.sort((a, b) => a.localeCompare(b));
  return ["amenities", unique.join(",")];
}

function decodeAmenityListSegment(segment?: string): string[] {
  if (!segment) return [];
  return segment
    .split(/[+,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item !== "x" && VALID_AMENITY_IDS.has(item));
}

export function encodeCanonicalSegments(
  filters: SearchFilterState,
  extras: CanonicalExtras = {},
): string[] {
  const locationSlug = slugify(filters.location?.trim() || "", "any");
  const { slug: countrySlug } = normalizeCountry(filters.country);
  const { slug: typeSlug } = normalizePropertyType(filters.propertyType);

  const segments: string[] = [countrySlug, locationSlug, typeSlug];

  const bedsKey = encodeBedsOrBaths(filters.bedrooms);
  if (bedsKey !== "any") {
    segments.push(`bed-${bedsKey}`);
  }

  const bathsKey = encodeBedsOrBaths(filters.bathrooms);
  if (bathsKey !== "any") {
    segments.push(`bath-${bathsKey}`);
  }

  const priceSegment = encodePriceSegment(filters.minPrice, filters.maxPrice);
  if (priceSegment) {
    segments.push(priceSegment);
  }

  const amenitySegments = encodeAmenitySegments(filters.amenities);
  segments.push(...amenitySegments);

  const sortKey = (extras.sort ?? CANONICAL_DEFAULTS.sort).trim();
  if (sortKey && sortKey !== CANONICAL_DEFAULTS.sort) {
    segments.push(`sort-${sortKey}`);
  }

  const pageNumber = extras.page ?? CANONICAL_DEFAULTS.page;
  if (pageNumber > 1) {
    segments.push(`page-${pageNumber}`);
  }

  if (typeof extras.results === "number" && extras.results >= 0) {
    segments.push(`results-${extras.results}`);
  }

  return segments;
}

export function encodeCanonicalPath(
  listingType: ListingType,
  filters: SearchFilterState,
  extras: CanonicalExtras = {},
): string {
  const segments = encodeCanonicalSegments(filters, extras);
  return `/${listingType}/${segments.join("/")}`;
}

export function decodeCanonicalPath(path: string): DecodedCanonical {
  const [purePath] = path.split("?");
  const rawSegments = purePath.split("/").filter(Boolean);

  const looksLegacy = rawSegments.some(
    (segment) =>
      segment.startsWith("location-") ||
      segment.startsWith("country-") ||
      segment.startsWith("type-") ||
      segment.startsWith("beds-") ||
      segment.startsWith("baths-"),
  );

  const decoded = looksLegacy
    ? decodeLegacyCanonicalSegments(rawSegments)
    : decodeNewCanonicalSegments(rawSegments);

  const canonicalSegments = encodeCanonicalSegments(decoded.filters, decoded.extras);

  return {
    filters: decoded.filters,
    extras: decoded.extras,
    segments: canonicalSegments,
  };
}

function decodeNewCanonicalSegments(segments: string[]): DecodedCanonical {
  const filters: Required<SearchFilterState> = {
    location: "",
    country: CANONICAL_DEFAULTS.country,
    propertyType: CANONICAL_DEFAULTS.propertyType,
    minPrice: "",
    maxPrice: "",
    bedrooms: CANONICAL_DEFAULTS.bedrooms,
    bathrooms: CANONICAL_DEFAULTS.bathrooms,
    amenities: [],
  };

  let sort: string = CANONICAL_DEFAULTS.sort;
  let page: number = CANONICAL_DEFAULTS.page;
  let results: number | undefined;

  const [countrySegment = "all", locationSegment = "any", typeSegment = "any", ...rest] = segments;

  filters.country = decodeCountrySegment(countrySegment);
  filters.location = locationSegment === "any" ? "" : unslugify(locationSegment);
  filters.propertyType = decodePropertyTypeSegment(typeSegment);

  for (let i = 0; i < rest.length; i += 1) {
    const segment = rest[i];

    if (segment.startsWith("bed-")) {
      const key = segment.slice(4);
      filters.bedrooms = decodeBedsOrBaths(key);
      continue;
    }

    if (segment.startsWith("bath-")) {
      const key = segment.slice(5);
      filters.bathrooms = decodeBedsOrBaths(key);
      continue;
    }

    if (segment.startsWith("price-")) {
      decodePriceSegment(segment, filters);
      continue;
    }

    if (segment === "amenities") {
      const listSegment = rest[i + 1];
      filters.amenities = decodeAmenityListSegment(listSegment);
      if (listSegment !== undefined) {
        i += 1;
      }
      continue;
    }

    if (segment.startsWith("sort-")) {
      const key = segment.slice(5);
      if (key) {
        sort = key;
      }
      continue;
    }

    if (segment.startsWith("page-")) {
      const value = Number.parseInt(segment.slice(5), 10);
      if (!Number.isNaN(value) && value > 0) {
        page = value;
      }
      continue;
    }

    if (segment.startsWith("results-")) {
      const value = Number.parseInt(segment.slice(8), 10);
      if (!Number.isNaN(value) && value >= 0) {
        results = value;
      }
    }
  }

  return {
    filters,
    extras: { sort, page, results },
    segments,
  };
}

function decodeLegacyCanonicalSegments(segments: string[]): DecodedCanonical {
  const filters: Required<SearchFilterState> = {
    location: "",
    country: CANONICAL_DEFAULTS.country,
    propertyType: CANONICAL_DEFAULTS.propertyType,
    minPrice: "",
    maxPrice: "",
    bedrooms: CANONICAL_DEFAULTS.bedrooms,
    bathrooms: CANONICAL_DEFAULTS.bathrooms,
    amenities: [],
  };

  let sort: string = CANONICAL_DEFAULTS.sort;
  let page: number = CANONICAL_DEFAULTS.page;
  let results: number | undefined;

  segments.forEach((segment) => {
    if (!segment.includes("-")) return;

    const [category, ...rest] = segment.split("-");
    const value = rest.join("-");

    switch (category) {
      case "location":
        filters.location = value === "x" ? "" : unslugify(value);
        break;
      case "country":
        filters.country = decodeCountrySegment(value);
        break;
      case "type":
        filters.propertyType = decodePropertyTypeSegment(value);
        break;
      case "price": {
        const [minToken = "x", maxToken = "x"] = rest;
        filters.minPrice = minToken && minToken !== "x" ? parsePriceToken(minToken) : "";
        filters.maxPrice = maxToken && maxToken !== "x" ? parsePriceToken(maxToken) : "";
        break;
      }
      case "beds":
        filters.bedrooms = decodeBedsOrBaths(value);
        break;
      case "baths":
        filters.bathrooms = decodeBedsOrBaths(value);
        break;
      case "amenities":
        filters.amenities = decodeAmenityListSegment(value);
        break;
      case "sort":
        if (value) {
          sort = value;
        }
        break;
      case "page": {
        const parsed = Number.parseInt(value, 10);
        if (!Number.isNaN(parsed) && parsed > 0) {
          page = parsed;
        }
        break;
      }
      case "results": {
        const parsed = Number.parseInt(value, 10);
        if (!Number.isNaN(parsed) && parsed >= 0) {
          results = parsed;
        }
        break;
      }
      default:
        break;
    }
  });

  return {
    filters,
    extras: { sort, page, results },
    segments,
  };
}

export function encodeLegacyQuery(
  filters: SearchFilterState,
  extras: CanonicalExtras = {},
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.location) params.set("location", filters.location);
  if (filters.country && filters.country !== "All") params.set("country", filters.country);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.propertyType && filters.propertyType !== "Any")
    params.set("type", filters.propertyType);
  if (filters.bedrooms && filters.bedrooms !== "Any") params.set("beds", filters.bedrooms);
  if (filters.bathrooms && filters.bathrooms !== "Any") params.set("baths", filters.bathrooms);
  if (filters.amenities && filters.amenities.length > 0)
    params.set("amenities", filters.amenities.join(","));
  if (extras.sort && extras.sort !== CANONICAL_DEFAULTS.sort) params.set("sort", extras.sort);
  if (extras.page && extras.page > 1) params.set("page", extras.page.toString());

  return params;
}

export function decodeLegacyQuery(params: URLSearchParams): {
  filters: SearchFilterState;
  extras: CanonicalExtras;
} {
  const amenitiesParam = params.get("amenities");
  const sortParam = params.get("sort");
  const pageParam = params.get("page");

  const filters: SearchFilterState = {
    location: params.get("location") || "",
    country: params.get("country") || CANONICAL_DEFAULTS.country,
    minPrice: params.get("minPrice") || "",
    maxPrice: params.get("maxPrice") || "",
    propertyType: params.get("type") || CANONICAL_DEFAULTS.propertyType,
    bedrooms: params.get("beds") || CANONICAL_DEFAULTS.bedrooms,
    bathrooms: params.get("baths") || CANONICAL_DEFAULTS.bathrooms,
    amenities: amenitiesParam ? amenitiesParam.split(",").filter(Boolean) : [],
  };

  const extras: CanonicalExtras = {
    sort: sortParam || CANONICAL_DEFAULTS.sort,
  };

  if (pageParam) {
    const parsed = parseInt(pageParam, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      extras.page = parsed;
    }
  }

  return { filters, extras };
}
