import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Building2, MapPin, Search, Filter, ChevronRight, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Project } from "../types";
import api from "../config/api";

const DeveloperProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        // Real API call (your api wrapper prefixes /api)
        const { data } = await api.get("dev/v1/projects");
        // DRF-style {results, count} OR plain array
        const raw: any[] = Array.isArray(data) ? data : (data?.results ?? []);
        const normalized = raw.map(normalizeProject);
        setProjects(normalized);
        setFilteredProjects(normalized);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
        setFilteredProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Client-side filtering
  useEffect(() => {
    let filtered = projects;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter((p) =>
        [p.name, p.location, p.description].some((t) => (t || "").toLowerCase().includes(q))
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((p) => p.status === selectedStatus);
    }

    if (selectedLocation !== "all") {
      const loc = selectedLocation.toLowerCase();
      filtered = filtered.filter((p) => (p.location || "").toLowerCase().includes(loc));
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, selectedStatus, selectedLocation]);

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "available", label: "Available" },
    { value: "construction", label: "Under Construction" },
    { value: "completed", label: "Completed" },
    { value: "planning", label: "Planning" },
  ];

  const locationOptions = [
    { value: "all", label: "All Locations" },
    { value: "paphos", label: "Paphos" },
    { value: "limassol", label: "Limassol" },
    { value: "ayia napa", label: "Ayia Napa" },
    { value: "protaras", label: "Protaras" },
    { value: "nicosia", label: "Nicosia" },
    { value: "troodos", label: "Troodos" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="flex justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Developer Projects</h1>
          <p className="text-gray-600">Discover exceptional developments from Cyprus's leading property developers</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {locationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredProjects.length} of {projects.length} projects
          </p>
        </div>

        {/* Projects List */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredProjects.map((project, index) => (
              <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <ProjectCard project={project} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------
   Image + URL Helpers (shared by normalizer)
-------------------------------------------- */
const API_BASE = (api as any)?.defaults?.baseURL?.replace(/\/$/, "") || window.location.origin;

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

// Gather project image URLs from lots of likely fields + units fallback
function extractProjectImageUrls(p: any): string[] {
  const buckets: any[] = [];
  // Common list-like fields
  buckets.push(p.images, p.media, p.gallery, p.photos, p.assets, p.gallery_images);
  // Single fields
  buckets.push(p.main_image, p.cover_image, p.hero_image, p.thumbnail);
  // Fallback: unit media
  if (Array.isArray(p.units)) {
    buckets.push(
      p.units
        .filter(Boolean)
        .map((u: any) => u?.media || u?.images || u?.gallery || u?.photo || u?.assets)
    );
  }
  // Flatten → absolute → dedupe
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

// Project Card Component
const ProjectCard = ({ project }: { project: Project }) => {
  const statusColors = {
    planning: "bg-yellow-100 text-yellow-800",
    construction: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    available: "bg-purple-100 text-purple-800",
  } as const;

  const statusLabels = {
    planning: "Planning",
    construction: "Under Construction",
    completed: "Completed",
    available: "Available",
  } as const;

  const mainImg = project.mainImage || (project.images && project.images[0]) || "";

  const countryChip = project.country
    ? project.country === "Cyprus"
      ? "🇨🇾 Cyprus"
      : project.country === "Greece"
      ? "🇬🇷 Greece"
      : `🌍 ${project.country}`
    : null;

  return (
    <Link
      to={`/projects/${project.id}`}
      className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden group transform hover:-translate-y-2 block"
    >
      <div className="relative h-96 md:h-[500px] overflow-hidden">
        {mainImg ? (
          <img
            src={mainImg}
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
            onError={(e) => {
              // If the URL is broken, show the no-image panel instead of a mock stock photo
              (e.currentTarget as HTMLImageElement).style.display = "none";
              const fallback = (e.currentTarget.nextSibling as HTMLElement);
              if (fallback) fallback.classList.remove("hidden");
            }}
          />
        ) : null}

        {/* No Image Panel (hidden if image exists and loads) */}
        <div className={`${mainImg ? "hidden" : ""} absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center`}>
          <div className="text-center text-white/90">
            <div className="mx-auto mb-3 w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <ImageIcon className="w-7 h-7" />
            </div>
            <div className="text-lg font-medium">No image available</div>
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        <div className="absolute top-6 left-6">
          <span
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              statusColors[project.status]
            } backdrop-blur-sm`}
          >
            {statusLabels[project.status]}
          </span>
        </div>

        {countryChip && (
          <div className="absolute top-6 right-6">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/90 text-gray-800 backdrop-blur-sm">
              {countryChip}
            </span>
          </div>
        )}

        {/* Project Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 group-hover:text-blue-200 transition-colors duration-300">
              {project.name}
            </h2>
            <div className="flex items-center text-white/90 mb-4">
              <MapPin className="h-5 w-5 mr-2" />
              <span className="text-lg">{project.location}</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 border border-white/30">
            <ChevronRight className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      <div className="p-8">
        <p className="text-gray-600 text-lg mb-6 leading-relaxed">{project.description}</p>

        {/* Property Types */}
        <div className="flex flex-wrap gap-3 mb-6">
          {project.propertyTypes?.map((type, index) => (
            <span
              key={index}
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200"
            >
              {type}
            </span>
          ))}
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-2 mb-6">
          {project.amenities?.slice(0, 4).map((amenity, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
            >
              {amenity}
            </span>
          ))}
          {project.amenities && project.amenities.length > 4 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              +{project.amenities.length - 4} more
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-8">
            <div>
              <span className="text-gray-500 text-sm block">Starting from</span>
              <span className="font-bold text-2xl text-gray-900">
                {project.priceRange?.min ? `€${project.priceRange.min.toLocaleString()}` : "—"}
              </span>
            </div>
            <div>
              <span className="text-gray-500 text-sm block">Total Units</span>
              <span className="font-semibold text-lg text-gray-900">{project.totalUnits ?? "—"}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Available Units</div>
            <div className="flex items-center">
              <span className="font-bold text-xl text-green-600 mr-2">{project.availableUnits ?? 0}</span>
              <span className="text-gray-400">/ {project.totalUnits ?? 0}</span>
            </div>
            <div className="w-24 bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width:
                    project.totalUnits && project.totalUnits > 0
                      ? `${((project.availableUnits ?? 0) / project.totalUnits) * 100}%`
                      : "0%",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DeveloperProjects;

/** Normalize backend Project -> UI Project type, with robust image extraction */
function normalizeProject(p: any): Project {
  const images = extractProjectImageUrls(p);
  const mainImage =
    toAbsoluteUrl(p.main_image) ||
    toAbsoluteUrl(p.cover_image) ||
    toAbsoluteUrl(p.hero_image) ||
    images[0];

  return {
    id: String(p.id ?? p.uuid ?? ""),
    developerId: String(p.organization ?? p.developerId ?? ""),
    name: p.name ?? p.title ?? "Unnamed Project",
    description: p.description ?? "",
    location: p.location ?? "",
    country: p.country ?? "",
    status: p.status ?? "planning",
    totalUnits: p.total_units ?? p.units_total ?? p.totalUnits ?? 0,
    availableUnits: p.available_units ?? p.units_available ?? p.availableUnits ?? 0,
    priceRange: {
      min: p.price_min ?? 0,
      max: p.price_max ?? 0,
      currency: p.currency ?? "EUR",
    },
    propertyTypes: p.property_types ?? [],
    amenities: p.amenities ?? [],
    images,        // ✅ absolute URLs collected from many shapes
    mainImage,     // ✅ robust hero fallback
    features: p.features ?? [],
    createdAt: p.created_at ?? p.createdAt ?? undefined,
    updatedAt: p.updated_at ?? p.updatedAt ?? undefined,
  };
}
