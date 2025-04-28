import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";      // ← NEW
import { apiClient } from "../middleware/auth";
import { useUser } from "../context/UserContext";

interface Property {
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
}

const MyListings = () => {
  const { user, loading: userLoading } = useUser();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /* ───── pagination state ───── */
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(properties.length / itemsPerPage);
  const currentProperties = properties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const navigate = useNavigate();
  const username = user?.username ?? "";

  /* smooth-scroll to top when page changes (kept from your code) */
  const first = useRef(true);
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [currentPage]);

  /* …fetch listings logic stays exactly as before… */
  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchListings = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get<Property[]>("/properties/my-properties");
        setProperties(data.map(p => ({ ...p, price: Number(p.price) || 0 })));
        setError(null);
      } catch (err: any) {
        console.error("Error fetching listings:", err);
        setError(
          err?.response?.data?.message ||
            "Failed to fetch your listings. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [user, userLoading]);

  /* publish / remove handlers unchanged … */
  const handlePublish = async (id: number) => { /* … */ };
  const handleRemove  = async (id: number) => { /* … */ };

  /* ───── Loading & error UI (unchanged) ───── */
  if (loading || userLoading) { /* … */ }
  if (error) { /* … */ }

  /* ───── Main UI ───── */
  return (
    <div className="min-h-screen pt-20 px-4">
      <div className="container mx-auto">
        {/* header & create-listing button (unchanged) */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
          <button
            onClick={() => navigate("/create-listing")}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full"
          >
            <Plus className="h-8 w-8" />
          </button>
        </div>

        {/* empty-state block (unchanged) */}
        {properties.length === 0 ? (
          /* … your No-Properties block … */
          <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            {/* … */}
          </div>
        ) : (
          <>
            {/* ───── Animated grid (only part that changed) ───── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ x: 200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -200, opacity: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {currentProperties.map(p => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/property/${p.id}`)}
                    className="relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    {/* …card markup exactly as you had it… */}
                    <img
                      src={p.images[0]?.image || "/placeholder-property.jpg"}
                      alt={p.title}
                      className="w-full h-64 object-cover"
                    />
                    {/* badges, details, buttons … unchanged … */}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* ───── Pagination buttons (unchanged) ───── */}
            <div className="flex justify-center items-center mt-8 space-x-4 mb-12">
              <button
                onClick={() => setCurrentPage(curr => Math.max(curr - 1, 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-md ${
                  currentPage === 1
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-4 py-2 rounded-md ${
                    currentPage === i + 1
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(curr => Math.min(curr + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-md ${
                  currentPage === totalPages
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
    </div>
  );
};

export default MyListings;
