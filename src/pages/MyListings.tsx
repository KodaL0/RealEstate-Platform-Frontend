import { AnimatePresence, motion } from "framer-motion";
import { Home, Plus } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropertyAnalytics from "../components/analytics/PropertyAnalytics";
import MyPropertyCard from "../components/cards/MyPropertyCard";
import EditSectionModal from "../components/modals/EditSectionModal";
import api from "../config/api";
import { useUser } from "../context/UserContext";

/* ───────────── type ───────────── */
interface MyListingsProperty {
  id: number;
  title: string;
  description: string;
  price: string | number;
  location: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities: string[];
  images: { image: string }[];
  created_at: string;
  updated_at: string;
  property_status: string;
  is_published: boolean;
}

function MyListings() {
  const { user, isLoading: userLoading } = useUser();
  const [properties, setProperties] = useState<MyListingsProperty[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* pagination */
  const [page, setPage] = useState(1);
  const PER_PAGE = 6;
  const total = Math.ceil(properties.length / PER_PAGE);
  const view = properties.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  /* edit section modal */
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | number | null>(null);
  const [selectedPropertyTitle, setSelectedPropertyTitle] = useState<string>("");

  /* analytics modal */
  const [analyticsPropertyId, setAnalyticsPropertyId] = useState<number | null>(null);

  const navigate = useNavigate();
  const username = user?.username ?? "";

  /* scroll-up on page change */
  const first = useRef(true);
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, []);

  /* fetch */
  useEffect(() => {
    if (userLoading) return;
    if (!user) return;

    (async () => {
      try {
        setLoading(true);
        const response = await api.properties.getUserProps(username);
        const data = response.data as unknown;
        const propertiesArray = Array.isArray(data)
          ? data
          : data && typeof data === "object" && "results" in data
            ? ((data as { results?: unknown[] }).results ?? [])
            : [];
        setProperties(
          propertiesArray.map((p: unknown) => {
            const prop = p as MyListingsProperty;
            return {
              ...prop,
              price: Number(prop.price) || 0,
            };
          }),
        );
        setError(null);
      } catch (err: unknown) {
        console.error(err);
        const apiError = err as { response?: { data?: { message?: string } } };
        setError(
          apiError.response?.data?.message ||
            "Failed to fetch your listings. Please try again later.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [user, userLoading, username]);

  /* publish / remove */
  const handlePublish = async (id: string | number) => {
    if (!username) return alert("User info unavailable");
    if (!window.confirm("Publish this listing?")) return;
    try {
      await api.put(`properties/${username}/property/${id}/publish`);
      setProperties((ps) => ps.map((p) => (p.id === id ? { ...p, is_published: true } : p)));
    } catch (err: unknown) {
      console.error(err);
      const apiError = err as { response?: { data?: { error?: string } } };
      setError(apiError.response?.data?.error || "Failed to publish listing.");
    }
  };

  const handleUnpublish = async (id: string | number) => {
    if (!username) return alert("User info unavailable");
    if (!window.confirm("Unpublish this listing? It will no longer be visible to the public."))
      return;
    try {
      await api.put(`properties/${username}/property/${id}/unpublish`);
      setProperties((ps) => ps.map((p) => (p.id === id ? { ...p, is_published: false } : p)));
    } catch (err: unknown) {
      console.error(err);
      const apiError = err as { response?: { data?: { error?: string } } };
      setError(apiError.response?.data?.error || "Failed to unpublish listing.");
    }
  };

  const handleRemove = async (id: string | number) => {
    if (!username) return alert("User info unavailable");
    if (!window.confirm("Remove this listing?")) return;
    try {
      await api.delete(`properties/${username}/property/${id}/delete`);
      setProperties((ps) => ps.filter((p) => p.id !== id));
      setPage((p) => Math.min(p, Math.max(1, Math.ceil((properties.length - 1) / PER_PAGE))));
    } catch (err: unknown) {
      console.error(err);
      const apiError = err as { response?: { data?: { error?: string } } };
      setError(apiError.response?.data?.error || "Failed to remove listing.");
    }
  };

  const handleEditClick = (id: string | number) => {
    const property = properties.find((p) => p.id === id);
    setSelectedPropertyId(id);
    setSelectedPropertyTitle(property?.title || "Property");
    setIsEditModalOpen(true);
  };

  const handleSectionSelect = (section: number) => {
    if (selectedPropertyId !== null) {
      navigate(`/edit-listing/${selectedPropertyId}?step=${section}`);
    }
    setIsEditModalOpen(false);
    setSelectedPropertyId(null);
  };

  const handleViewAnalytics = (id: string | number) => {
    setAnalyticsPropertyId(Number(id));
  };

  /* early states */
  if (userLoading || loading)
    return (
      <div className="min-h-screen pt-20 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="container mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );

  /* UI */
  return (
    <div className="min-h-screen pt-20 px-4">
      <div className="container mx-auto">
        {/* Edit Section Modal */}
        <EditSectionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedPropertyId(null);
          }}
          onSelectSection={handleSectionSelect}
          propertyTitle={selectedPropertyTitle}
        />
        {/* header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
          <button
            onClick={() => navigate("/create-listing")}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full"
          >
            <Plus className="h-8 w-8" />
          </button>
        </div>

        {/* empty */}
        {properties.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Home className="mx-auto h-16 w-16 text-gray-400 mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No Properties Listed Yet</h2>
            <p className="text-gray-600 mb-8">Get started by creating your first listing.</p>
            <button
              onClick={() => navigate("/create-listing")}
              className="inline-flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Listing
            </button>
          </div>
        ) : (
          <>
            {/* cards with slide animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ x: 200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -200, opacity: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {view.map((property) => {
                  // Convert MyListingsProperty to Property type for MyPropertyCard
                  const propertyForCard: Property = {
                    id: String(property.id),
                    title: property.title,
                    description: property.description,
                    price:
                      typeof property.price === "number"
                        ? property.price
                        : Number(property.price) || 0,
                    location: property.location,
                    country: "Cyprus", // Default value
                    property_type: property.property_type,
                    bedrooms: property.bedrooms,
                    bathrooms: property.bathrooms,
                    area: property.area,
                    year_built: 0, // Default value
                    parking_spaces: 0, // Default value
                    property_status: property.property_status,
                    contact_phone: "", // Default value
                    contact_email: "", // Default value
                    amenities: property.amenities,
                    owner: {
                      username: username,
                      id: String(user?.id || ""),
                      email: user?.email || "",
                    },
                    is_published: property.is_published,
                    created_at: property.created_at,
                    updated_at: property.updated_at,
                    images: property.images.map((img) => ({
                      image: img.image,
                      is_primary: false,
                    })),
                  };
                  return (
                    <MyPropertyCard
                      key={property.id}
                      property={propertyForCard}
                      onEdit={handleEditClick}
                      onRemove={handleRemove}
                      onPublish={handlePublish}
                      onUnpublish={handleUnpublish}
                      onNavigate={(id) => navigate(`/property/${id}`)}
                      onViewAnalytics={handleViewAnalytics}
                    />
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* pagination */}
            <div className="flex justify-center mt-8 space-x-4 mb-12">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-4 py-2 rounded-md ${
                  page === 1
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Previous
              </button>
              {Array.from({ length: total }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`px-4 py-2 rounded-md ${
                    page === i + 1
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(total, p + 1))}
                disabled={page === total}
                className={`px-4 py-2 rounded-md ${
                  page === total
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* Analytics Modal */}
      {analyticsPropertyId && (
        <div
          className="fixed top-20 left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setAnalyticsPropertyId(null)}
        >
          <div
            className="w-full max-w-4xl max-h-[calc(100vh-6rem)] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <PropertyAnalytics
              propertyId={analyticsPropertyId}
              onClose={() => setAnalyticsPropertyId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MyListings;
