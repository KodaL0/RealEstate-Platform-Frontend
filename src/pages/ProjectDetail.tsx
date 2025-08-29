import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Building2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Bed,
  Bath,
  Square,
  Euro,
  Check,
  Star,
  Phone,
  Mail,
  Home,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Project, Developer } from "../types";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from "../types";
import api from "../config/api";

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

// Base URL for making relative paths absolute
const API_BASE =
  (api as any)?.defaults?.baseURL?.replace(/\/$/, "") || window.location.origin;

function toAbsoluteUrl(u?: string | null): string | undefined {
  if (!u) return undefined;
  try {
    return new URL(u, API_BASE).href;
  } catch {
    return u || undefined;
  }
}

// Extract string URLs from many possible shapes
function pickImageStrings(input: any): string[] {
  if (!input) return [];
  if (typeof input === "string") return [input];

  if (Array.isArray(input)) {
    return input.flatMap(pickImageStrings);
  }

  // Common object keys used by different backends
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

// Gather project image URLs from lots of likely fields + units fallback
function extractProjectImageUrls(p: any): string[] {
  const buckets: any[] = [];

  // Common list fields
  buckets.push(p.images);
  buckets.push(p.media); // e.g. [{ image: "..." }]
  buckets.push(p.gallery);
  buckets.push(p.photos);
  buckets.push(p.assets);
  buckets.push(p.gallery_images);

  // Single fields
  buckets.push(p.main_image);
  buckets.push(p.cover_image);
  buckets.push(p.hero_image);
  buckets.push(p.thumbnail);

  // Fallback to unit media if present
  if (Array.isArray(p.units)) {
    buckets.push(
      p.units
        .filter(Boolean)
        .map(
          (u: any) => u?.media || u?.images || u?.gallery || u?.photo || u?.assets
        )
    );
  }

  // Flatten → to absolute → de-dupe (stable)
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
   Price + Availability Helpers
   =========================== */

// Format money without .00
function formatPrice(
  value?: number | null,
  currency: string = "EUR",
  locale?: string
): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(locale || undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);
}

// Normalize any raw unit status to 'available' | 'reserved' | 'sold'
function normalizeAvailability(u: any): "available" | "reserved" | "sold" | undefined {
  // direct booleans first
  if (u.is_available === true) return "available";
  if (u.is_available === false) return u.reserved || u.on_hold ? "reserved" : "sold";
  if (u.sold === true) return "sold";
  if (u.reserved === true || u.on_hold === true) return "reserved";

  // common string fields
  const raw =
    u.status ??
    u.availability ??
    u.state ??
    u.sale_status ??
    u.availability_status ??
    u.stock_status;

  if (!raw || typeof raw !== "string") return undefined;

  const s = raw.toString().trim().toLowerCase();

  if (
    ["available", "active", "in stock", "on market", "vacant", "open"].includes(s) ||
    /^available/.test(s)
  ) return "available";

  if (
    ["reserved", "on hold", "pending", "hold", "deposit"].includes(s) ||
    /^reser/.test(s) ||
    /^pend/.test(s)
  ) return "reserved";

  if (
    ["sold", "unavailable", "closed", "completed", "off market"].includes(s) ||
    /^sold/.test(s)
  ) return "sold";

  return undefined;
}

/* ===========================
   Component
   =========================== */

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "units" | "amenities" | "floorplans" | "gallery"
  >("overview");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        // 1) Fetch project
        const { data: projectRaw } = await api.get(`dev/v1/projects/${id}`);
        const proj = normalizeProject(projectRaw);
        setProject(proj);

        // 2) Grab developer/org
        const orgId =
          projectRaw.organization ?? projectRaw.developerId ?? proj.developerId;
        if (orgId) {
          const { data: orgRaw } = await api.get(`dev/v1/orgs/${orgId}`);
          setDeveloper(normalizeDeveloper(orgRaw));
        } else {
          setDeveloper(null);
        }

        // 3) Units: use embedded if present, else fetch by project
        const embeddedUnits = Array.isArray(projectRaw.units) ? projectRaw.units : null;
        if (embeddedUnits && embeddedUnits.length) {
          setUnits(embeddedUnits.map(normalizeUnit));
        } else {
          const { data: unitsRaw } = await api.get(`dev/v1/units`, {
            params: { project: id },
          });
          const list = Array.isArray(unitsRaw) ? unitsRaw : unitsRaw?.results ?? [];
          const normalized = list.map(normalizeUnit);
          setUnits(normalized);

          // (Optional) If project-level counts are missing, derive them
          // if (proj && (proj.totalUnits === 0 || proj.availableUnits === 0)) {
          //   const availableCount = normalized.filter(u => u.status === "available").length;
          //   setProject(prev => prev ? { ...prev, totalUnits: normalized.length, availableUnits: availableCount } : prev);
          // }
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
  }, [id]);

  const nextImage = () => {
    if (project?.images?.length) {
      setCurrentImageIndex((prev) => (prev + 1) % project.images.length);
    }
  };

  const prevImage = () => {
    if (project?.images?.length) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + project.images.length) % project.images.length
      );
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

  // Tabs (added "Units")
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "units", label: `Units (${units.length})` },
    { id: "amenities", label: "Amenities" },
    { id: "floorplans", label: "Floor Plans" },
    { id: "gallery", label: "Gallery" },
  ] as const;

  const hasImages = (project.images && project.images.length > 0) || !!project.mainImage;
  const heroImg = hasImages
    ? project.images?.[currentImageIndex] || project.mainImage!
    : "";

      // Derive availability when project counts are missing/stale
  const totalUnitsDerived = project.totalUnits || units.length || 0;
  const availableFromUnits =
    units.length ? units.filter((u) => u.status === "available").length : undefined;

  // prefer project.availableUnits if it’s a positive number; otherwise use derived value
  const availableUnitsDerived =
    typeof project.availableUnits === "number" && project.availableUnits >= 0
      ? project.availableUnits
      : (availableFromUnits ?? 0);

  const soldShare =
    totalUnitsDerived > 0
      ? (totalUnitsDerived - availableUnitsDerived) / totalUnitsDerived
      : 0;

  const soldPct = Math.round(soldShare * 100);


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
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

        {/* Image Navigation */}
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
                  {project.availableUnits} of {project.totalUnits} available
                </span>
              </div>
              {project.priceRange?.min != null && (
                <div className="flex items-center">
                  <Euro className="h-4 w-4 mr-2" />
                  <span>From {formatPrice(project.priceRange.min, project.priceRange.currency)}</span>
                </div>
              )}
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      About {project.name}
                    </h2>
                    {project.description && (
                      <p className="text-gray-600 leading-relaxed mb-6">
                        {project.description}
                      </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {project.propertyTypes?.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">
                            Property Types
                          </h3>
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
                          <h3 className="font-semibold text-gray-900 mb-3">
                            Key Features
                          </h3>
                          <div className="space-y-2">
                            {project.features.slice(0, 4).map((feature, i) => (
                              <div key={i} className="flex items-center">
                                <Check className="h-4 w-4 text-green-600 mr-2" />
                                <span className="text-gray-600 text-sm">
                                  {feature}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {(project.startDate || project.completionDate) && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">
                          Project Timeline
                        </h3>
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
                      {project.priceRange && (
                        <div>
                          <p className="text-sm text-gray-500">Price Range</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatPrice(project.priceRange.min, project.priceRange.currency)}{" "}
                            {project.priceRange.max
                              ? `- ${formatPrice(project.priceRange.max, project.priceRange.currency)}`
                              : ""}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Available Units</span>
                        <span className="font-semibold text-gray-900">
                          {availableUnitsDerived} of {totalUnitsDerived}
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${soldShare * 100}%` }}
                        />
                      </div>

                      {totalUnitsDerived > 0 && (
                        <p className="text-sm text-gray-500">{soldPct}% sold</p>
                      )}
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
                          <p className="text-sm text-gray-600 mb-3">
                            {developer.description}
                          </p>
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
                  {(developer?.phone || developer?.email) && (
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Contact Developer
                      </h3>
                      <div className="space-y-3">
                        {developer?.phone && (
                          <a
                            href={`tel:${developer.phone}`}
                            className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Call Now
                          </a>
                        )}
                        {developer?.email && (
                          <a
                            href={`mailto:${developer.email}?subject=Inquiry about ${project.name}`}
                            className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </a>
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
                  {project.availableUnits} of {project.totalUnits} units available
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
                            {u.price != null ? formatPrice(u.price, u.currency || "EUR") : "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                u.status === "available"
                                  ? "bg-green-100 text-green-800"
                                  : u.status === "reserved"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : u.status === "sold"
                                  ? "bg-gray-200 text-gray-700"
                                  : "bg-slate-100 text-slate-700"
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Project Amenities
                </h2>
                <p className="text-gray-600">
                  Discover the premium amenities and facilities available at {project.name}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(project.amenities ?? []).map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center p-4 bg-gray-50 rounded-lg"
                    >
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

          {/* Floorplans (derived from units when available) */}
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
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">
                          {plan.name}
                        </h3>

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
                              {formatPrice(plan.price ?? 0, project.priceRange?.currency || "EUR")}
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
                    Detailed floor plans will be available soon. Contact the developer for more information.
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
            name:
              u.name ?? u.code ?? `${u.bedrooms ?? "—"}BR ${u.unit_type ?? "Unit"}`,
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
                  u.file_url
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
    images: imageUrls, // absolute URLs
    mainImage, // robust hero fallback
    features: p.features ?? [],
    coordinates:
      p.latitude && p.longitude ? { lat: p.latitude, lng: p.longitude } : undefined,
    floorPlans,
    createdAt: p.created_at ?? p.createdAt ?? undefined,
    updatedAt: p.updated_at ?? p.updatedAt ?? undefined,
  };
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
    completedProjects:
      d.completed_projects ?? d.projects_completed ?? undefined,
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
    unit_type: u.unit_type ?? u.type ?? undefined,
    bedrooms: u.bedrooms ?? u.beds ?? undefined,
    bathrooms: u.bathrooms ?? u.baths ?? undefined,
    area_total: u.area_total ?? u.area_internal ?? u.size ?? undefined,
    price: u.price ?? u.asking_price ?? u.list_price ?? undefined,
    currency: (u.currency ?? u.price_currency ?? "EUR") as string,
    status: normalizeAvailability(u),
  };
}
