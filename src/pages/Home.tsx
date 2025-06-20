import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ArrowRight,
  Building,
  Home as HomeIcon,
  Briefcase,
  Award,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PropertyCard from "../components/PropertyCard";
import { Property } from "../types";
import api from "../config/api";

const PAGE_SIZE = 12;   // cards per page
const NAV_HEIGHT = 80;  // px – adjust to your fixed-navbar height

function Home() {
  /* ───────────── state ───────────── */
  const [featured, setFeatured] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  /* track if it's the first render (to skip auto-scroll) */
  const firstScroll = useRef(true);
  /* track if it's the initial data load (to suppress initial spinner) */
  const firstLoad = useRef(true);

  /* ref for the "Featured Properties" section (for scrolling) */
  const featuredTopRef = useRef<HTMLDivElement | null>(null);

  const mortgages = [
    {
      name: 'Hellenic Bank',
      description: 'Budget your monthly expenses with a fixed monthly instalment for 3, 5 or 10 years',
      rate: '3.80%',
      logoUrl: '/public/Hellenic_bank_Official_Logo.png',
    },
    {
      name: 'Bank of Cyprus',
      description: 'Option for a variable interest rate for the whole duration of the loan or a fixed rate for 3, 5 or 10 years.',
      rate: '4.66%',
      logoUrl: '/public/boc-logo-small.png',
    },
    {
      name: 'Alpha Bank',
      description: 'Buy, build or renovate your home without using up your own funds.',
      rate: '5.80%',
      logoUrl: '/public/alpha-bank-vector-logo-400x400.png',
    },
  ];

  /* ───────────── fetch one page of featured properties ───────────── */
  useEffect(() => {
    let canceled = false;

    const getFeaturedPage = async () => {
      // Only show spinner if not initial load
      if (!firstLoad.current) {
        setLoading(true);
      }
      setError(null);
      try {
        // SERVER-SIDE PAGINATION: ask for exactly PAGE_SIZE items on this page
        const res = await api.properties.featured({ page, page_size: PAGE_SIZE });
        if (canceled) return;
        setFeatured(res.results || []);       // exactly the current page's items
        setTotalCount(res.count || 0);        // total number of featured items in DB
      } catch (err) {
        if (canceled) return;
        console.error("Error fetching featured properties:", err);
        setError("Failed to load featured properties. Please try again later.");
      } finally {
        if (!canceled) {
          setLoading(false);
          firstLoad.current = false; // mark that initial load has happened
        }
      }
    };

    getFeaturedPage();
    return () => {
      canceled = true;
    };
  }, [page]);

  /* ───────────── compute total pages from server count ───────────── */
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  /* ───────────── scroll to Featured section ONLY when page > 1 ───────────── */
  useLayoutEffect(() => {
    // If this is initial load (page === 1) or we just mounted, do nothing.
    if (page === 1 || firstScroll.current) {
      firstScroll.current = false;
      return;
    }
    // Don't scroll while the new page is still loading
    if (loading) return;
    if (featuredTopRef.current) {
      const offset =
        featuredTopRef.current.getBoundingClientRect().top +
        window.scrollY -
        NAV_HEIGHT;
      window.scrollTo({ top: offset, behavior: "smooth" });
    }
  }, [page, loading]);

  const jumpToPage = (p: number) => {
    if (p === page) return;
    setPage(p);
  };

  /* ───────────── JSX ───────────── */
  return (
    <div className="bg-white">
      {/* ───────────── Hero Section ───────────── */}
      <section className="relative h-[70vh] md:h-[75vh]">
        <div
          className="absolute inset-0 bg-cover bg-center animate-in fade-in duration-1000"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
          {/* Bottom fade to hint at content below */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>

        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center animate-in slide-in-from-bottom duration-700">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 md:mb-6 leading-tight animate-in slide-in-from-left duration-700 delay-200">
              Find Your <span className="text-blue-400">Dream Home</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-6 md:mb-8 animate-in slide-in-from-left duration-700 delay-300">
              Discover the perfect property that matches your lifestyle and aspirations with our exclusive listings.
            </p>

            <div className="bg-white/95 backdrop-blur-md p-4 md:p-5 rounded-xl shadow-2xl animate-in slide-in-from-left duration-700 delay-400">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-grow">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter an address, city, or ZIP code"
                      className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex space-x-4">
                  <Link
                    to={`/buy${searchTerm ? `?location=${encodeURIComponent(searchTerm)}` : ''}`}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-8 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg active:scale-[0.98]"
                  >
                    Buy
                  </Link>
                  <Link
                    to={`/rent${searchTerm ? `?location=${encodeURIComponent(searchTerm)}` : ''}`}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 px-8 rounded-lg font-medium transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                  >
                    Rent
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Featured Properties ───────────── */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div ref={featuredTopRef} className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div>
              <span className="inline-block text-blue-600 font-medium mb-2">Exclusive Listings</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Featured Properties</h2>
              <p className="text-gray-600 mt-2 max-w-2xl">
                Explore our hand-picked selection of premium properties in the most desirable locations
              </p>
            </div>
            <Link
              to="/buy"
              className="group flex items-center text-blue-600 hover:text-blue-700 font-medium mt-4 md:mt-0"
            >
              View All
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Show error if any */}
          {error && (
            <div className="text-center text-red-600 bg-red-100 p-4 rounded-lg mb-8">
              Could not load featured properties:&nbsp;{error}
            </div>
          )}

          {/* Animate the grid as a whole, keyed by `page` */}
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ x: 200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -200, opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {featured.length
                ? /* We no longer slice here; `featured` is exactly page N's items */
                  featured.map((prop) => (
                    <PropertyCard key={prop.id} property={prop} />
                  ))
                : !loading && (
                  <p className="col-span-full text-center text-gray-500">
                    No featured properties available at the moment.
                  </p>
                )}
            </motion.div>
          </AnimatePresence>

          {/* spinner overlay only after initial load (page > 1) */}
          {!firstLoad.current && loading && (
            <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-70">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
          )}

          {/* pagination buttons */}
          {!error && totalPages > 1 && (
            <div className="flex justify-center mt-12 space-x-2">
              {Array.from({ length: totalPages }).map((_, i) => {
                const n = i + 1;
                const active = n === page;
                return (
                  <button
                    key={n}
                    onClick={() => jumpToPage(n)}
                    className={`h-10 w-10 rounded-full border transition-all
                      ${
                        active
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
                      }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ───────────── Available Mortgages in Cyprus ───────────── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Available mortgages in Cyprus</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mortgages.map((m, idx) => {
              // For the first card we mimic the pink background from your screenshot; others white
              const isFirst = idx === 0;
              const bgClass = isFirst ? 'bg-pink-50' : 'bg-white';
              const borderClass = isFirst ? 'border-pink-200' : 'border-gray-200';
              return (
                <div
                  key={m.name}
                  className={`${bgClass} border ${borderClass} rounded-xl p-6 flex flex-col justify-between`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{m.name}</h3>
                    {m.logoUrl && (
                      <img
                        src={m.logoUrl}
                        alt={`${m.name} logo`}
                        className="h-8 w-auto object-contain"
                      />
                    )}
                  </div>
                  <p className="text-gray-700 flex-grow">{m.description}</p>
                  <p className="mt-4 text-sm font-medium text-gray-900">
                    Starting rate {m.rate}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

          {/* single CTA button */}
          <Link
            to="/buy"
            className="group bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl inline-flex items-center justify-center"
          >
            Browse Properties
            <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
