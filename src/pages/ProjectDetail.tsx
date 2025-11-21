import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bath,
  Bed,
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Euro,
  Globe,
  Home,
  Mail,
  MapPin,
  Phone,
  Square,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ChatButton from "../components/ChatButton";
import api from "../config/api";
import developersApi from "../config/developers-api";
import {
  type Developer,
  PROJECT_STATUS_COLORS,
  PROJECT_STATUS_LABELS,
  type Project,
  type PropertyImage,
} from "../types";
import { generateProjectSlug } from "../utils/developerUtils";

type UnitRow = {
  id: string;
  code?: string;
  unit_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  area_total?: number;
  price?: number;
  currency?: string;
  status?: "available" | "reserved" | "sold";
  is_primary?: boolean;
};

/* ===========================
   Image + URL Helpers
   =========================== */
// Base URL (works with axios baseURL or falls back to origin)
const API_BASE = (api as any)?.defaults?.baseURL?.replace(/\/$/, "") || window.location.origin;

/** Resolve a possibly-relative URL to an absolute URL against API_BASE. */
export function toAbsoluteUrl(u?: string | null): string | undefined {
  if (!u) return undefined;
  try {
    return new URL(u, API_BASE).href;
  } catch {
    return u || undefined;
  }
}

/** Collects any string-like image paths from a loose object/array structure. */
export function pickImageStrings(input: any): string[] {
  if (!input) return [];
  if (typeof input === "string") return [input];
  if (Array.isArray(input)) return input.flatMap(pickImageStrings);

  const candidates = [
    input.image,
    input.url,
    input.src,
    input.file,
    input.file_url,
    input.path,
    input.thumbnail,
    input.preview,
  ].filter(Boolean);

  return candidates as string[];
}

/**
 * Walk a "project" (or similar) object and extract all possible image URLs,
 * returning a de-duplicated absolute-URL list.
 */
export function extractProjectImageUrls(p: any): string[] {
  const buckets: any[] = [];
  buckets.push(p.images, p.media, p.gallery, p.photos, p.assets, p.gallery_images);
  buckets.push(p.main_image, p.cover_image, p.hero_image, p.thumbnail);

  if (Array.isArray(p.units)) {
    buckets.push(
      p.units
        .filter(Boolean)
        .map((u: any) => u?.media || u?.images || u?.gallery || u?.photo || u?.assets),
    );
  }

  const seen = new Set<string>();
  const urls: string[] = [];
  for (const raw of buckets.flatMap(pickImageStrings)) {
    const abs = toAbsoluteUrl(String(raw));
    if (abs && !seen.has(abs)) {
      seen.add(abs);
      urls.push(abs);
    }
  }
  return urls;
}

/* ===========================
   Property/thumbnail helpers
   =========================== */

/** Normalize mixed image inputs to a consistent PropertyImage shape. */
export function normaliseImages(imgs: any[] = []): PropertyImage[] {
  return imgs
    .flatMap((i, index) =>
      typeof i === "string"
        ? [{ image: toAbsoluteUrl(i)!, is_primary: index === 0 }]
        : pickImageStrings(i).map((s, subIndex) => ({
            image: toAbsoluteUrl(s)!,
            is_primary: index === 0 && subIndex === 0,
          })),
    )
    .filter((x) => !!x.image)
    .map((img, idx) => ({
      ...img,
      display_order: idx,
    }));
}

/** Accepts either a string or {image:string} and returns the absolute URL. */
export function toImageUrl(img: string | { image: string } | undefined | null): string {
  if (!img) return "";
  if (typeof img === "string") return toAbsoluteUrl(img) || img;
  return toAbsoluteUrl(img.image) || img.image;
}

/** Classify orientation by width/height ratio. */
export type ImgOrientation = "portrait" | "landscape" | "square";

/** Infer image orientation by loading the image dimensions. */
export function getImageOrientation(imageUrl: string): Promise<ImgOrientation> {
  return new Promise((resolve) => {
    const el = new Image();
    el.onload = () => {
      const ratio = el.width / el.height;
      if (ratio > 1.2) resolve("landscape");
      else if (ratio < 0.8) resolve("portrait");
      else resolve("square");
    };
    el.onerror = () => resolve("landscape"); // sensible fallback
    el.src = imageUrl;
  });
}

/** Tailwind class helper for a lightbox/main image based on orientation. */
export function imageOrientationClass(orientation: ImgOrientation): string {
  const base = "object-contain rounded-lg shadow-2xl";
  switch (orientation) {
    case "portrait":
      return `${base} max-h-[85vh] max-w-[70vw] md:min-w-[600px] lg:min-w-[700px] xl:min-w-[800px]`;
    case "landscape":
      return `${base} max-h-[85vh] max-w-[90vw] md:min-h-[400px] lg:min-h-[500px]`;
    default:
      return `${base} max-h-[85vh] max-w-[90vw] md:min-w-[400px] md:min-h-[400px] lg:min-w-[500px] lg:min-h-[500px]`;
  }
}

/** Ordinal formatter (1 -> 1st, 2 -> 2nd, …) with safe coercion. */
export function formatOrdinal(n: string | number): string {
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  const abs = Math.abs(num);
  const tens = abs % 100;
  if (tens >= 11 && tens <= 13) return `${num}th`;
  switch (abs % 10) {
    case 1:
      return `${num}st`;
    case 2:
      return `${num}nd`;
    case 3:
      return `${num}rd`;
    default:
      return `${num}th`;
  }
}

/* ===========================
   Responsive grid utility
   =========================== */

/**
 * Returns the number of columns in the thumbnail grid for current viewport.
 * Keep in sync with: grid-cols-5 md:grid-cols-8 lg:grid-cols-10
 */
export function computeGridCols(viewportWidth: number): number {
  if (viewportWidth >= 1024) return 10; // lg
  if (viewportWidth >= 768) return 8; // md
  return 5; // base
}

/* ===========================
   Formatters / Normalizers
   =========================== */

function formatPrice(value?: number, currency: string = "EUR") {
  if (value == null) return "—";
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : "";
  return `${symbol}${Math.round(value).toLocaleString()}`;
}

function normalizeStatus(raw: any): UnitRow["status"] {
  if (!raw) return undefined;
  const s = String(raw).toLowerCase().trim();
  if (["available", "active", "for sale", "for-sale", "open", "vacant", "avail"].includes(s))
    return "available";
  if (["reserved", "hold", "on hold", "on-hold", "booked", "pending", "in-progress"].includes(s))
    return "reserved";
  if (["sold", "unavailable", "closed", "completed", "sold_out", "sold-out"].includes(s))
    return "sold";
  return undefined;
}

/** Derive availability counts (prefer units, fall back to project aggregates) */
function computeAvailability(project: Project | null, units: UnitRow[]) {
  if (units?.length) {
    const total = units.length;
    let available = 0;
    let reserved = 0;
    let sold = 0;
    for (const u of units) {
      const s = normalizeStatus(u.status);
      if (s === "available") available++;
      else if (s === "reserved") reserved++;
      else if (s === "sold") sold++;
    }
    const soldPct = total ? Math.round((sold / total) * 100) : 0;
    return { total, available, reserved, sold, soldPct };
  }
  const total = project?.totalUnits ?? 0;
  const available = project?.availableUnits ?? 0;
  const sold = Math.max(0, total - available);
  const soldPct = total ? Math.round((sold / total) * 100) : 0;
  return { total, available, reserved: 0, sold, soldPct };
}

/* ===========================
   Component
   =========================== */

const ProjectDetail = () => {
  const { id, orgSlug, projectSlug } = useParams<{
    id?: string;
    orgSlug?: string;
    projectSlug?: string;
  }>();
  const [project, setProject] = useState<Project | null>(null);
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "units" | "amenities" | "floorplans" | "gallery"
  >("overview");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // Store raw project data to access sale/rent price ranges
  const [rawProjectData, setRawProjectData] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      const hasSlugRoute = !!(orgSlug && projectSlug);
      if (!id && !hasSlugRoute) return;
      setIsLoading(true);
      setError(null);
      try {
        // 1) Project: prefer public by slug; fallback to id
        let projectRaw: any;
        if (hasSlugRoute) {
          const org = await developersApi.organizations.getPublic(orgSlug!);
          const projects = await developersApi.projects.listPublic({
            organization: Number(org.id),
          });
          const list = Array.isArray(projects) ? projects : ((projects as any)?.results ?? []);

          // Debug logging
          console.log("🔍 Looking for project:", { orgSlug, projectSlug });
          console.log(
            "📋 Available projects:",
            list.map((p: any) => ({
              id: p.id,
              name: p.name || p.title,
              apiSlug: p.slug,
              generatedSlug: generateProjectSlug(p.name || p.title || ""),
            })),
          );

          const match = list.find((p: any) => {
            const slug = (p as any).slug || generateProjectSlug(p.name || p.title || "");
            // Case-insensitive comparison and trim whitespace
            return slug.toLowerCase().trim() === projectSlug?.toLowerCase().trim();
          });

          if (!match) {
            console.error("❌ No match found. Expected:", projectSlug);
            console.error(
              "Available slugs:",
              list.map((p: any) => (p as any).slug || generateProjectSlug(p.name || p.title || "")),
            );
            throw new Error("Project not found for slug");
          }
          projectRaw = match;
        } else {
          projectRaw = await developersApi.projects.getPublic(Number(id));
        }
        // Store raw data for price ranges
        setRawProjectData(projectRaw);
        const proj = normalizeProject(projectRaw);
        setProject(proj);

        // 2) Developer/org
        // 2) Developer/org (public)
        const orgId = projectRaw.organization ?? projectRaw.developerId ?? proj.developerId;
        const orgRaw = orgId ? await developersApi.organizations.getPublic(String(orgId)) : null;
        setDeveloper(orgRaw ? normalizeDeveloper(orgRaw) : null);

        // 3) Units: embedded or fetch
        const embeddedUnits = Array.isArray(projectRaw.units) ? projectRaw.units : null;
        if (embeddedUnits?.length) {
          setUnits(embeddedUnits.map(normalizeUnit));
        } else {
          const list = await developersApi.units.listPublic({ project: Number(proj.id) });
          setUnits(list.map(normalizeUnit));
        }
      } catch (e) {
        console.error("Error fetching project/developer/units:", e);
        setError("Failed to fetch project information. Please try again.");
        setProject(null);
        setDeveloper(null);
        setUnits([]);
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [id, orgSlug, projectSlug]);

  // Derived availability (no hooks)
  const { total, available, reserved, sold, soldPct } = computeAvailability(project, units);

  // Images
  const hasImages = (project?.images && project.images.length > 0) || !!project?.mainImage;
  const heroImg = hasImages ? project?.images?.[currentImageIndex] || project?.mainImage! : "";

  const nextImage = () => {
    if (project?.images?.length) {
      setCurrentImageIndex((prev) => (prev + 1) % project.images.length);
    }
  };

  const prevImage = () => {
    if (project?.images?.length) {
      setCurrentImageIndex((prev) => (prev - 1 + project.images.length) % project.images.length);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="flex justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading project information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-semibold">!</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading project</h3>
                <p className="mt-1 text-sm text-red-700">{error || "Project not found"}</p>
                <Link
                  to="/developers"
                  className="mt-3 inline-block px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm font-medium transition-colors"
                >
                  Back to Developers
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "units", label: `Units (${units.length})` },
    { id: "amenities", label: "Amenities" },
    { id: "floorplans", label: "Floor Plans" },
    { id: "gallery", label: "Gallery" },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative h-96 bg-gray-900 pt-20">
        <div className="absolute inset-0">
          {hasImages ? (
            <img
              src={heroImg}
              alt={project.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                if (project.mainImage) {
                  (e.currentTarget as HTMLImageElement).src = project.mainImage;
                }
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center">
              <div className="flex items-center space-x-3 text-white/90">
                <Home className="h-7 w-7" />
                <span className="text-lg">No images available</span>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {hasImages && project.images && project.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors z-10"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors z-10"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {project.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-8">
          <div className="text-white">
            <Link
              to={developer ? `/developer/${developer.id}` : "/developers"}
              className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {developer?.name ?? "Developers"}
            </Link>
            <div className="flex items-center mb-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mr-4 ${
                  PROJECT_STATUS_COLORS[project.status]
                }`}
              >
                {PROJECT_STATUS_LABELS[project.status]}
              </span>
              {project.country && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white">
                  {project.country === "Cyprus" ? "🇨🇾" : "🇬🇷"} {project.country}
                </span>
              )}
            </div>
            <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
            <div className="flex items-center space-x-6 text-white/90">
              {project.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{project.location}</span>
                </div>
              )}
              <div className="flex items-center">
                <Building2 className="h-4 w-4 mr-2" />
                <span>
                  {available} of {total} available
                </span>
              </div>
              {(() => {
                const saleMin = rawProjectData?.sale_price_min;
                const rentMin = rawProjectData?.rent_price_min;
                const currency = rawProjectData?.currency || "EUR";
                
                // Show sale price first, then rent if available
                if (saleMin != null) {
                  return (
                    <div className="flex items-center">
                      <Euro className="h-4 w-4 mr-2" />
                      <span>
                        From {formatPrice(saleMin, currency)} (Sale)
                      </span>
                    </div>
                  );
                }
                if (rentMin != null) {
                  return (
                    <div className="flex items-center">
                      <Euro className="h-4 w-4 mr-2" />
                      <span>
                        From {formatPrice(rentMin, currency)} (Rent)
                      </span>
                    </div>
                  );
                }
                // Fallback to legacy priceRange
                if (project.priceRange?.min != null && project.priceRange.min > 0) {
                  return (
                    <div className="flex items-center">
                      <Euro className="h-4 w-4 mr-2" />
                      <span>
                        From {formatPrice(project.priceRange.min, project.priceRange.currency)}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Overview */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">About {project.name}</h2>
                    {project.description && (
                      <p className="text-gray-600 leading-relaxed mb-6">{project.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {project.propertyTypes?.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Property Types</h3>
                          <div className="flex flex-wrap gap-2">
                            {project.propertyTypes.map((type, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {project.features?.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Key Features</h3>
                          <div className="space-y-2">
                            {project.features.slice(0, 4).map((feature, i) => (
                              <div key={i} className="flex items-center">
                                <Check className="h-4 w-4 text-green-600 mr-2" />
                                <span className="text-gray-600 text-sm">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {(project.startDate || project.completionDate) && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Project Timeline</h3>
                        <div className="flex items-center space-x-8">
                          {project.startDate && (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              <div>
                                <p className="text-sm text-gray-500">Started</p>
                                <p className="font-medium text-gray-900">
                                  {new Date(project.startDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          )}
                          {project.completionDate && (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              <div>
                                <p className="text-sm text-gray-500">Completion</p>
                                <p className="font-medium text-gray-900">
                                  {new Date(project.completionDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Price & Availability */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Price & Availability</h3>

                    <div className="space-y-4">
                      {/* Display price ranges - prefer sale, show rent if available */}
                      {(() => {
                        const saleMin = rawProjectData?.sale_price_min;
                        const saleMax = rawProjectData?.sale_price_max;
                        const rentMin = rawProjectData?.rent_price_min;
                        const rentMax = rawProjectData?.rent_price_max;
                        const currency = rawProjectData?.currency || "EUR";

                        // Determine which price range to show
                        const hasSale = saleMin != null || saleMax != null;
                        const hasRent = rentMin != null || rentMax != null;

                        if (!hasSale && !hasRent) {
                          // Fallback to legacy priceRange
                          if (project.priceRange && (project.priceRange.min > 0 || project.priceRange.max > 0)) {
                            return (
                              <div>
                                <p className="text-sm text-gray-500">Price Range</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {formatPrice(project.priceRange.min, project.priceRange.currency)}{" "}
                                  {project.priceRange.max && project.priceRange.max > project.priceRange.min
                                    ? `- ${formatPrice(project.priceRange.max, project.priceRange.currency)}`
                                    : ""}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }

                        return (
                          <div className="space-y-3">
                            {hasSale && (
                              <div>
                                <p className="text-sm text-gray-500 mb-1">For Sale</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {saleMin && saleMax && saleMin !== saleMax
                                    ? `${formatPrice(saleMin, currency)} - ${formatPrice(saleMax, currency)}`
                                    : saleMin
                                      ? `From ${formatPrice(saleMin, currency)}`
                                      : saleMax
                                        ? `Up to ${formatPrice(saleMax, currency)}`
                                        : "—"}
                                </p>
                              </div>
                            )}
                            {hasRent && (
                              <div>
                                <p className="text-sm text-gray-500 mb-1">For Rent</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {rentMin && rentMax && rentMin !== rentMax
                                    ? `${formatPrice(rentMin, currency)} - ${formatPrice(rentMax, currency)}`
                                    : rentMin
                                      ? `From ${formatPrice(rentMin, currency)}`
                                      : rentMax
                                        ? `Up to ${formatPrice(rentMax, currency)}`
                                        : "—"}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Available Units</span>
                        <span className="font-semibold text-gray-900">
                          {available} of {total}
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${soldPct}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-500">{soldPct}% sold</p>

                      <p className="text-sm text-gray-500">
                        <span className="text-emerald-600 font-medium">{available} available</span>
                        {" · "}
                        <span className="text-amber-600 font-medium">{reserved} reserved</span>
                        {" · "}
                        <span className="text-blue-600 font-medium">{sold} sold</span>
                      </p>
                    </div>
                  </div>

                  {/* Developer Info */}
                  {developer && (
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Developer</h3>
                      <Link to={`/developer/${developer.id}`} className="block group">
                        <h4 className="font-medium text-blue-600 group-hover:text-blue-700 mb-2">
                          {developer.name}
                        </h4>
                        {developer.description && (
                          <p className="text-sm text-gray-600 mb-3">{developer.description}</p>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          {developer.rating != null && (
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                              <span>{developer.rating}</span>
                            </div>
                          )}
                          <span className="text-gray-500">
                            {developer.totalProjects ?? 0} projects
                          </span>
                        </div>
                      </Link>
                    </div>
                  )}

                  {/* Contact */}
                  {(developer?.phone || developer?.email || developer?.website) && (
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Contact Developer</h3>
                      <div className="space-y-4">
                        {developer?.phone && (
                          <div className="flex items-center p-4 rounded-xl bg-blue-50 border border-blue-100">
                            <div className="p-2 rounded-lg bg-white shadow-sm mr-3">
                              <Phone className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-500 text-sm uppercase font-medium">Phone</p>
                              <a
                                href={`tel:${encodeURIComponent(developer.phone.trim())}`}
                                className="text-blue-600 font-semibold hover:text-blue-700 block"
                              >
                                {developer.phone}
                              </a>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!developer?.phone) return;
                                try {
                                  await navigator.clipboard.writeText(developer.phone);
                                  // You could add a toast notification here
                                } catch (err) {
                                  console.error("Failed to copy phone number:", err);
                                }
                              }}
                              className="ml-auto p-2 hover:bg-blue-100 rounded-lg flex-shrink-0 transition-colors"
                              title="Copy phone number"
                            >
                              <Copy className="h-4 w-4 text-gray-500" />
                            </button>
                          </div>
                        )}
                        {developer?.email && (
                          <div className="flex items-center p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                            <div className="p-2 rounded-lg bg-white shadow-sm mr-3">
                              <Mail className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-500 text-sm uppercase font-medium">Email</p>
                              <a
                                href={`mailto:${encodeURIComponent(developer.email.trim())}?subject=Inquiry about ${encodeURIComponent(project.name)}`}
                                className="text-blue-600 font-semibold hover:text-blue-700 break-all block"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {developer.email}
                              </a>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!developer?.email) return;
                                try {
                                  await navigator.clipboard.writeText(developer.email);
                                  // You could add a toast notification here
                                } catch (err) {
                                  console.error("Failed to copy email:", err);
                                }
                              }}
                              className="ml-auto p-2 hover:bg-blue-100 rounded-lg flex-shrink-0 transition-colors"
                              title="Copy email"
                            >
                              <Copy className="h-4 w-4 text-gray-500" />
                            </button>
                          </div>
                        )}
                        {developer?.website && (
                          <div className="flex items-center p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                            <div className="p-2 rounded-lg bg-white shadow-sm mr-3">
                              <Globe className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-500 text-sm uppercase font-medium">Website</p>
                              <a
                                href={
                                  developer.website.startsWith("http://") || developer.website.startsWith("https://")
                                    ? developer.website
                                    : `https://${developer.website}`
                                }
                                className="text-green-600 font-semibold hover:text-green-700 break-all block"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {developer.website}
                              </a>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!developer?.website) return;
                                const websiteUrl =
                                  developer.website.startsWith("http://") ||
                                  developer.website.startsWith("https://")
                                    ? developer.website
                                    : `https://${developer.website}`;
                                try {
                                  await navigator.clipboard.writeText(websiteUrl);
                                  // You could add a toast notification here
                                } catch (err) {
                                  console.error("Failed to copy website:", err);
                                }
                              }}
                              className="ml-auto p-2 hover:bg-green-100 rounded-lg flex-shrink-0 transition-colors"
                              title="Copy website URL"
                            >
                              <Copy className="h-4 w-4 text-gray-500" />
                            </button>
                          </div>
                        )}
                        
                        {/* Message button */}
                        {developer?.id && (
                          <div className="pt-4 border-t border-gray-100">
                            <ChatButton
                              sellerId={Number(developer.id)}
                              itemId={Number(project.id)}
                              itemType="project"
                              title={project.name}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Units */}
          {activeTab === "units" && (
            <motion.div
              key="units"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Units</h2>
                <p className="text-gray-600">
                  {available} of {total} units available
                  {units.length > 0 && (
                    <>
                      {" · "}
                      <span className="text-emerald-600 font-medium">{available} available</span>
                      {" · "}
                      <span className="text-amber-600 font-medium">{reserved} reserved</span>
                      {" · "}
                      <span className="text-blue-600 font-medium">{sold} sold</span>
                    </>
                  )}
                </p>
              </div>

              {units.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Units information coming soon
                  </h3>
                  <p className="text-gray-600">
                    Contact the developer for detailed unit availability and pricing.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Beds
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Baths
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Area (m²)
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {units.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {u.code ?? "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {u.unit_type ?? "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                            {u.bedrooms ?? "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                            {u.bathrooms ?? "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                            {u.area_total != null ? u.area_total : "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                            {u.price != null ? formatPrice(u.price, u.currency) : "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                u.status === "available"
                                  ? "bg-green-100 text-green-800"
                                  : u.status === "reserved"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : u.status === "sold"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              {u.status ?? "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* Amenities */}
          {activeTab === "amenities" && (
            <motion.div
              key="amenities"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Amenities</h2>
                <p className="text-gray-600">
                  Discover the premium amenities and facilities available at {project.name}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(project.amenities ?? []).map((amenity, index) => (
                    <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <Check className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Floorplans */}
          {activeTab === "floorplans" && (
            <motion.div
              key="floorplans"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Floor Plans</h2>
                <p className="text-gray-600">
                  Choose from our selection of thoughtfully designed floor plans
                </p>
              </div>

              {project.floorPlans && project.floorPlans.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {project.floorPlans.map((plan, index) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-sm overflow-hidden"
                    >
                      {plan.image && (
                        <div className="h-48 overflow-hidden">
                          <img
                            src={plan.image}
                            alt={plan.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              if (project.mainImage) {
                                (e.currentTarget as HTMLImageElement).src = project.mainImage;
                              }
                            }}
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">{plan.name}</h3>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-1">
                              <Bed className="h-5 w-5 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500">Bedrooms</p>
                            <p className="font-semibold text-gray-900">{plan.bedrooms}</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-1">
                              <Bath className="h-5 w-5 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500">Bathrooms</p>
                            <p className="font-semibold text-gray-900">{plan.bathrooms}</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-1">
                              <Square className="h-5 w-5 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500">Area</p>
                            <p className="font-semibold text-gray-900">{plan.area}m²</p>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Starting from</span>
                            <span className="text-2xl font-bold text-gray-900">
                              {formatPrice(plan.price, "EUR")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Floor Plans Coming Soon
                  </h3>
                  <p className="text-gray-600">
                    Detailed floor plans will be available soon. Contact the developer for more
                    information.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Gallery */}
          {activeTab === "gallery" && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Gallery</h2>
                <p className="text-gray-600">Explore high-quality images of {project.name}</p>
              </div>

              {hasImages ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(project.images ?? []).map((image, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative aspect-square overflow-hidden rounded-xl shadow-sm hover:shadow-lg transition-shadow cursor-pointer group"
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <img
                        src={image}
                        alt={`${project.name} - Image ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          if (project.mainImage) {
                            (e.currentTarget as HTMLImageElement).src = project.mainImage;
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No images available</h3>
                  <p className="text-gray-600">This project doesn’t have images yet.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProjectDetail;

/* ===========================
   Normalizers (backend → UI)
   =========================== */

function normalizeProject(p: any): Project {
  const imageUrls = extractProjectImageUrls(p);

  const mainImage =
    toAbsoluteUrl(p.main_image) ||
    toAbsoluteUrl(p.cover_image) ||
    toAbsoluteUrl(p.hero_image) ||
    imageUrls[0];

  const floorPlans =
    Array.isArray(p.units) && p.units.length
      ? p.units
          .filter((u: any) => u)
          .map((u: any) => ({
            id: String(u.id ?? u.uuid ?? ""),
            name: u.name ?? u.code ?? `${u.bedrooms ?? "—"}BR ${u.unit_type ?? "Unit"}`,
            bedrooms: u.bedrooms ?? 0,
            bathrooms: u.bathrooms ?? 0,
            area: u.area_total ?? u.area_internal ?? 0,
            price: u.price ?? 0,
            image:
              toAbsoluteUrl(
                (Array.isArray(u.media) &&
                  (u.media[0]?.image ||
                    u.media[0]?.url ||
                    u.media[0]?.src ||
                    u.media[0]?.file ||
                    u.media[0]?.file_url)) ||
                  u.image ||
                  u.url ||
                  u.src ||
                  u.file ||
                  u.file_url,
              ) || mainImage,
          }))
      : [];

  return {
    id: String(p.id ?? p.uuid ?? ""),
    developerId: String(p.organization ?? p.developerId ?? ""),
    name: p.name ?? p.title ?? "Unnamed Project",
    description: p.description ?? "",
    location: p.location ?? "",
    country: p.country ?? "",
    status: p.status ?? "planning",
    startDate: p.start_date ?? undefined,
    completionDate: p.completion_date ?? undefined,
    totalUnits: p.total_units ?? p.units_total ?? 0,
    availableUnits: p.available_units ?? p.units_available ?? 0,
    priceRange: {
      min: p.price_min ?? 0,
      max: p.price_max ?? 0,
      currency: p.currency ?? "EUR",
    },
    propertyTypes: p.property_types ?? [],
    amenities: p.amenities ?? [],
    images: imageUrls,
    mainImage,
    features: p.features ?? [],
    coordinates: p.latitude && p.longitude ? { lat: p.latitude, lng: p.longitude } : undefined,
    floorPlans,
    createdAt: p.created_at ?? p.createdAt ?? undefined,
    updatedAt: p.updated_at ?? p.updatedAt ?? undefined,
  } as Project;
}

function normalizeDeveloper(d: any): Developer {
  return {
    id: String(d.id ?? d.uuid ?? ""),
    name: d.name ?? "Unnamed Developer",
    description: d.description ?? "",
    established: d.established ?? d.founded_year ?? undefined,
    location: d.location ?? d.city ?? "",
    country: d.country ?? d.country_name ?? "",
    website: d.website ?? undefined,
    email: d.email ?? undefined,
    phone: d.phone ?? undefined,
    totalProjects: d.total_projects ?? d.projects_total ?? 0,
    activeProjects: d.active_projects ?? d.projects_active ?? 0,
    completedProjects: d.completed_projects ?? d.projects_completed ?? undefined,
    specialties: d.specialties ?? d.tags ?? [],
    rating: d.rating ?? d.avg_rating ?? undefined,
    reviewCount: d.review_count ?? d.reviews ?? 0,
    image: d.logo ?? d.logo_url ?? d.image ?? undefined,
    createdAt: d.created_at ?? d.createdAt ?? undefined,
    updatedAt: d.updated_at ?? d.updatedAt ?? undefined,
  };
}

function normalizeUnit(u: any): UnitRow {
  return {
    id: String(u.id ?? u.uuid ?? ""),
    code: u.code ?? u.name ?? undefined,
    unit_type: u.unit_type ?? undefined,
    bedrooms: u.bedrooms ?? undefined,
    bathrooms: u.bathrooms ?? undefined,
    area_total: u.area_total ?? u.area_internal ?? undefined,
    price: u.price ?? undefined,
    currency: u.currency ?? "EUR",
    status: normalizeStatus(u.status),
  };
}
