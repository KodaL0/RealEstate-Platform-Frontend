import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ArrowRight,
  ChevronRight,
  Loader2,
  ExternalLink,
  TrendingUp,
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

  /* ───────────── static mortgage offers ───────────── */
  const mortgages = [
    {
      name: 'EuroBank',
      description: 'Budget your monthly expenses with a fixed monthly instalment for 3, 5 or 10 years',
      rate: '3.80%',
      logoUrl: '/eurobank-logo.png',  // ensure this file is in public/
      url: 'https://www.eurobank.cy/en/personal/housing',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      name: 'Bank of Cyprus',
      description: 'Option for a variable interest rate for the whole duration of the loan or a fixed rate for 3, 5 or 10 years.',
      rate: '4.66%',
      logoUrl: '/boc-logo-small.png',  // ensure this file is in public/
      url: 'https://www.bankofcyprus.com/en-gb/Personal/loans/Housing/Your-first-home/',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      name: 'Alpha Bank',
      description: 'Buy, build or renovate your home without using up your own funds.',
      rate: '5.80%',
      logoUrl: '/alpha-bank-vector-logo-400x400.png',  // ensure this file is in public/
      url: 'https://www.alphabank.com.cy/en/individuals/loans/housing-loans',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
  ];

  /* ───────────── fetch one page of featured properties ───────────── */
  useEffect(() => {
    let canceled = false;

    const getFeaturedPage = async () => {
      if (!firstLoad.current) {
        setLoading(true);
      }
      setError(null);
      try {
        const res = await api.properties.featured({ page, page_size: PAGE_SIZE });
        if (canceled) return;
        setFeatured(res.results || []);
        setTotalCount(res.count || 0);
      } catch (err) {
        if (canceled) return;
        console.error("Error fetching featured properties:", err);
        setError("Failed to load featured properties. Please try again later.");
      } finally {
        if (!canceled) {
          setLoading(false);
          firstLoad.current = false;
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
    if (page === 1 || firstScroll.current) {
      firstScroll.current = false;
      return;
    }
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
      <section className="pt-20 md:pt-24 pb-4 md:pb-8 bg-gray-50">
        {/* Container with padding for white space on sides */}
        <div className="mx-auto px-1 sm:px-2 md:px-3 lg:px-4 xl:px-6 max-w-none">
          {/* Rounded hero container */}
          <div className="relative min-h-[55vh] md:min-h-[65vh] rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
            {/* Background Elements */}
            <div className="absolute inset-0">
              {/* Background image with overlay */}
              <div
                className="absolute inset-0 bg-cover bg-center rounded-2xl md:rounded-3xl"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80')",
                }}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/50 rounded-2xl md:rounded-3xl" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 h-full min-h-[55vh] md:min-h-[65vh] flex items-center px-8 sm:px-10 md:px-12 lg:px-16">
              <div className="w-full max-w-7xl mx-auto">
                {/* Hero Content */}
                <div className="text-center mb-6 lg:mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                  >
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 md:mb-4 leading-tight">
                      Your Hub for{" "}
                      <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                        Real Estate
                      </span>{" "}
                      in{" "}
                      <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                        Cyprus & Greece
                      </span>
                    </h1>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-base sm:text-lg md:text-xl text-white/90 mb-6 md:mb-8 max-w-2xl mx-auto"
                  >
                    Explore listings, compare projects, and connect directly with sellers.
                  </motion.p>
                </div>


                {/* Search Container */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="w-full max-w-6xl mx-auto"
                >
                  <div className="bg-white/95 backdrop-blur-xl rounded-2xl lg:rounded-3xl shadow-2xl p-4 sm:p-5 lg:p-6 border border-white/20">
                    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                      {/* Search Input */}
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <input
                            type="text"
                            placeholder="Enter an address, city, or ZIP code"
                            className="w-full pl-12 pr-4 py-3.5 lg:py-4 border border-gray-200 rounded-xl lg:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-500 text-base lg:text-lg font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 lg:flex-shrink-0">
                        <Link
                          to={`/buy${searchTerm ? `?location=${encodeURIComponent(searchTerm)}` : ''}`}
                          className="flex-1 lg:flex-initial bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3.5 lg:py-4 px-6 lg:px-8 rounded-xl lg:rounded-2xl font-semibold transition-all shadow-lg hover:shadow-xl active:scale-[0.98] text-center text-base lg:text-lg"
                        >
                          Buy
                        </Link>
                        <Link
                          to={`/rent${searchTerm ? `?location=${encodeURIComponent(searchTerm)}` : ''}`}
                          className="flex-1 lg:flex-initial bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white py-3.5 lg:py-4 px-6 lg:px-8 rounded-xl lg:rounded-2xl font-semibold transition-all shadow-lg hover:shadow-xl active:scale-[0.98] text-center text-base lg:text-lg"
                        >
                          Rent
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Featured Properties ───────────── */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-white via-[#f9fafb] to-[#f3f4f6]">
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

          {error && (
            <div className="text-center text-red-600 bg-red-100 p-4 rounded-lg mb-8">
              Could not load featured properties:&nbsp;{error}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ x: 200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -200, opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {featured.length ? (
                featured.map((prop) => (
                  <PropertyCard key={prop.id} property={prop} />
                ))
              ) : (
                !loading && (
                  <p className="col-span-full text-center text-gray-500">
                    No featured properties available at the moment.
                  </p>
                )
              )}
            </motion.div>
          </AnimatePresence>

          {!firstLoad.current && loading && (
            <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-70">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
          )}

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
      <section className="pt-24 pb-20 bg-gradient-to-b from-gray-50 to-white relative">
        <div className="container mx-auto px-4">
          {/* Enhanced title area */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full mb-6">
              <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
              <span className="text-blue-700 font-semibold text-sm uppercase tracking-wider">
                Financial Partners
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Available Mortgages in Cyprus
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Compare top bank offers and find the best rate for your home loan. 
              Our trusted financial partners offer competitive rates and flexible terms.
            </p>
          </div>
      
          {/* Enhanced grid wrapper */}
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mortgages.map((m, index) => (
                <motion.div
                  key={m.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group"
                >
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block ${m.bgColor} border-2 border-transparent hover:border-gray-200 p-8 rounded-3xl text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden h-full flex flex-col backdrop-blur-sm`}
                  >
                    {/* Subtle background pattern */}
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-10 transform translate-x-8 -translate-y-8">
                      <div className={`w-full h-full bg-gradient-to-br ${m.color} rounded-full blur-2xl`} />
                    </div>
                    
                    {/* Header with logo and name */}
                    <div className="relative z-10 mb-6">
                      <div className="flex items-center justify-center mb-4 space-x-3">
                        <h3 className="text-2xl font-bold text-gray-900">{m.name}</h3>
                        {m.logoUrl && (
                          <div className="flex-shrink-0">
                            <img
                              src={m.logoUrl}
                              alt={`${m.name} logo`}
                              className="h-10 w-auto object-contain group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Rate badge */}
                      {m.rate && (
                        <div className={`inline-block bg-gradient-to-r ${m.color} text-white px-6 py-2 rounded-full text-lg font-bold shadow-lg`}>
                          Starting at {m.rate}
                        </div>
                      )}
                    </div>
                    
                    {/* Description */}
                    <p className="text-gray-700 text-base leading-relaxed flex-grow mb-6 relative z-10">
                      {m.description}
                    </p>
                    
                    {/* CTA section */}
                    <div className="relative z-10 mt-auto">
                      <div className="flex items-center justify-center space-x-2 text-gray-600 group-hover:text-gray-800 transition-colors">
                        <span className="font-semibold">Learn More</span>
                        <ExternalLink className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                    
                    {/* Hover gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${m.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl`} />
                  </a>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Additional info section */}
          <div className="max-w-4xl mx-auto mt-16 text-center">
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-lg">
              <p className="text-gray-600 text-sm leading-relaxed">
                <strong className="text-gray-900">Disclaimer:</strong> Interest rates are subject to change and approval. 
                Terms and conditions apply. Please contact the respective banks for the most current rates and requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── CTA Section ───────────── */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560520031-3a4dc4e9de0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1073&q=80')] bg-cover bg-center opacity-10" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <span className="inline-block bg-white/20 backdrop-blur-md text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
            Take The Next Step
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Find Your Perfect Property?
          </h2>
          <p className="text-white/90 text-xl max-w-2xl mx-auto mb-8">
            Whether you're looking to buy, rent, or invest, our team is here to help you every step of the way.
          </p>
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