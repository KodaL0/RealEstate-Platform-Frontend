import {
  Briefcase,
  Building2,
  ExternalLink,
  FileText,
  Loader2,
  Map,
  MapPin,
  Users,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SEO } from "../components/SEO";

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

interface SitemapSection {
  name: string;
  icon: React.ReactNode;
  urls: SitemapUrl[];
  color: string;
}

const SitemapViewer: React.FC = () => {
  const [sections, setSections] = useState<SitemapSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSitemap = async (url: string): Promise<SitemapUrl[]> => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}`);

      const text = await response.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");

      // Check for parsing errors
      const parserError = xml.querySelector("parsererror");
      if (parserError) {
        throw new Error("XML parsing error");
      }

      const urls: SitemapUrl[] = [];
      const urlElements = xml.querySelectorAll("url");

      urlElements.forEach((urlEl) => {
        const loc = urlEl.querySelector("loc")?.textContent || "";
        const lastmod = urlEl.querySelector("lastmod")?.textContent;
        const changefreq = urlEl.querySelector("changefreq")?.textContent;
        const priority = urlEl.querySelector("priority")?.textContent;

        if (loc) {
          urls.push({
            loc: loc.replace("https://www.propertpro.com", ""),
            lastmod,
            changefreq,
            priority,
          });
        }
      });

      return urls;
    } catch (err) {
      console.error(`Error fetching ${url}:`, err);
      return [];
    }
  };

  useEffect(() => {
    const loadSitemaps = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load all sitemaps
        const [staticMap, propertiesMap, profilesMap, locationsMap, developersMap] =
          await Promise.all([
            fetchSitemap("/sitemap-static.xml"),
            fetchSitemap("/sitemap-properties.xml").catch(() => null),
            fetchSitemap("/sitemap-profiles.xml").catch(() => null),
            fetchSitemap("/sitemap-locations.xml").catch(() => null),
            fetchSitemap("/sitemap-developers.xml").catch(() => null),
          ]);

        const sectionsData: SitemapSection[] = [];

        // Static Pages
        if (staticMap.length > 0) {
          sectionsData.push({
            name: "Static Pages",
            icon: <FileText className="h-5 w-5" />,
            urls: staticMap,
            color: "bg-blue-500",
          });
        }

        // Location Pages
        if (locationsMap && locationsMap.length > 0) {
          sectionsData.push({
            name: "Location-Based Pages",
            icon: <MapPin className="h-5 w-5" />,
            urls: locationsMap.slice(0, 50), // Show first 50
            color: "bg-green-500",
          });
        }

        // Developers & Projects
        if (developersMap && developersMap.length > 0) {
          sectionsData.push({
            name: "Developers & Projects",
            icon: <Briefcase className="h-5 w-5" />,
            urls: developersMap.slice(0, 50), // Show first 50
            color: "bg-purple-500",
          });
        }

        // User Profiles (show sample)
        if (profilesMap && profilesMap.length > 0) {
          sectionsData.push({
            name: "User Profiles",
            icon: <Users className="h-5 w-5" />,
            urls: profilesMap.slice(0, 20), // Show first 20
            color: "bg-indigo-500",
          });
        }

        // Properties (show sample)
        if (propertiesMap && propertiesMap.length > 0) {
          sectionsData.push({
            name: "Property Listings",
            icon: <Map className="h-5 w-5" />,
            urls: propertiesMap.slice(0, 20), // Show first 20
            color: "bg-red-500",
          });
        }

        setSections(sectionsData);
      } catch (err) {
        console.error("Error loading sitemaps:", err);
        setError("Failed to load sitemap. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadSitemaps();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return dateString;
    }
  };

  const getBadgeColor = (priority?: string) => {
    if (!priority) return "bg-gray-100 text-gray-700";
    const num = parseFloat(priority);
    if (num >= 0.9) return "bg-green-100 text-green-800";
    if (num >= 0.7) return "bg-blue-100 text-blue-800";
    if (num >= 0.5) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading sitemap...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-md p-8 max-w-md mx-4">
          <p className="text-red-600 mb-4">{error}</p>
          <Link to="/" className="text-blue-600 hover:underline">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const totalUrls = sections.reduce((sum, section) => sum + section.urls.length, 0);

  return (
    <>
      <SEO
        title="Sitemap - PropertPro"
        description="Browse all pages on PropertPro including properties, locations, developers, and user profiles."
        url="/sitemap-view"
      />

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Map className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Site Map</h1>
              </div>
              <Link
                to="/"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Building2 className="h-5 w-5" />
                <span>Home</span>
              </Link>
            </div>

            <p className="text-gray-600 mb-4">
              Browse all pages available on PropertPro. This sitemap helps you discover properties,
              locations, developers, and more.
            </p>

            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{totalUrls.toLocaleString()} pages shown</span>
              <span>•</span>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <span>View XML Sitemap Index</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <span>•</span>
              <a
                href="/sitemap-static.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <span>Static Pages XML</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <span>•</span>
              <a
                href="/sitemap-properties.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <span>Properties XML</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Sitemap Sections */}
          <div className="space-y-6">
            {sections.map((section, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Section Header */}
                <div className={`${section.color} p-4 text-white`}>
                  <div className="flex items-center space-x-3">
                    {section.icon}
                    <h2 className="text-xl font-semibold">{section.name}</h2>
                    <span className="ml-auto text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                      {section.urls.length} {section.urls.length === 1 ? "page" : "pages"}
                    </span>
                  </div>
                </div>

                {/* URLs List */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {section.urls.map((url, urlIndex) => (
                      <div
                        key={urlIndex}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Link
                            to={url.loc}
                            className="text-blue-600 hover:text-blue-700 hover:underline flex-1 break-words text-sm font-medium"
                          >
                            {url.loc || "/"}
                          </Link>
                        </div>
                        <div className="flex items-center space-x-2 mt-2 flex-wrap">
                          {url.priority && (
                            <span
                              className={`text-xs px-2 py-1 rounded ${getBadgeColor(url.priority)}`}
                            >
                              Priority: {url.priority}
                            </span>
                          )}
                          {url.changefreq && (
                            <span className="text-xs text-gray-500 px-2 py-1 rounded bg-gray-100">
                              {url.changefreq}
                            </span>
                          )}
                        </div>
                        {url.lastmod && (
                          <p className="text-xs text-gray-500 mt-2">
                            Updated: {formatDate(url.lastmod)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Show more indicator if truncated */}
                  {section.urls.length >= 50 && (
                    <div className="mt-4 text-center text-sm text-gray-500">
                      Showing first 50 pages. View the{" "}
                      <a
                        href="/sitemap.xml"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        XML sitemap
                      </a>{" "}
                      for complete list.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Info */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About This Sitemap</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                This sitemap provides an overview of all pages available on PropertPro. For search
                engines, the complete XML sitemap is available at{" "}
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  /sitemap.xml
                </a>
                .
              </p>
              <p>
                The sitemap is automatically updated as new properties, locations, and profiles are
                added to the platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SitemapViewer;
