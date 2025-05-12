// src/components/Navbar.tsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, ChevronDown, Building2 } from "lucide-react";
import { useUser } from "../context/UserContext";
import { apiClient } from "../middleware/auth";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, setUser } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  // Shadow on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;
  const toggleMenu = () => setIsOpen(prev => !prev);

  const handleLogout = async () => {
    try {
      await apiClient.post("/users/logout");
    } catch (_) {}
    // Use the enhanced logout function from auth middleware
    // which handles cookie clearing and redirects properly
    import('../middleware/auth').then(auth => {
      auth.logout();
    });
  };

  return (
    <nav
      className={`
        fixed w-full z-50 transition-all duration-300
        ${scrolled ? "bg-white shadow-md" : "bg-transparent"}
        pt-[env(safe-area-inset-top)]
        h-[calc(4rem+env(safe-area-inset-top))]
      `}
    >
      <div className="container mx-auto px-4 md:px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <Building2 className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            PROPERTPRO
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className={`font-medium transition-colors ${isActive("/") ? "text-blue-600" : "text-white-700 hover:text-blue-600"}`}>Home</Link>
          <Link to="/buy" className={`font-medium transition-colors ${isActive("/buy") ? "text-blue-600" : "text-white-700 hover:text-blue-600"}`}>Buy</Link>
          <Link to="/rent" className={`font-medium transition-colors ${isActive("/rent") ? "text-blue-600" : "text-white-700 hover:text-blue-600"}`}>Rent</Link>
          <div className="relative group">
            <button className="flex items-center font-medium text-white-700 hover:text-blue-600 transition-colors">
              Services <ChevronDown className="ml-1 h-4 w-4" />
            </button>
            <div className="absolute left-0 mt-2 w-56 bg-white shadow-lg rounded-md overflow-hidden transform scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-200 origin-top-left z-50">
              <Link to="/mortgage-calculator" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                Mortgage Calculator
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <div className="relative group">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Hello, {user.username}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden transform scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-200 origin-top-right z-50">
                <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-blue-50">Profile</Link>
                <Link to="/my-listings" className="block px-4 py-2 text-gray-700 hover:bg-blue-50">My Listings</Link>
                <Link to="/favourites" className="block px-4 py-2 text-gray-700 hover:bg-blue-50">Favourites</Link>
                <button onMouseDown={handleLogout} className="w-full text-left block px-4 py-2 text-red-600 hover:bg-red-50 transition-colors">Logout</button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <User className="h-5 w-5" />
              <span>Sign In / Register</span>
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden p-2" onClick={toggleMenu}>
          {isOpen ? <X className="h-6 w-6 text-white-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden mt-4 bg-white rounded-lg shadow-lg p-4">
          <div className="flex flex-col space-y-4">
            <Link to="/" onClick={() => setIsOpen(false)} className={`font-medium ${isActive("/") ? "text-blue-600" : "text-gray-700"}`}>Home</Link>
            <Link to="/buy" onClick={() => setIsOpen(false)} className={`font-medium ${isActive("/buy") ? "text-blue-600" : "text-gray-700"}`}>Buy</Link>
            <Link to="/rent" onClick={() => setIsOpen(false)} className={`font-medium ${isActive("/rent") ? "text-blue-600" : "text-gray-700"}`}>Rent</Link>
            <Link to="/mortgage-calculator" onClick={() => setIsOpen(false)} className={`font-medium ${isActive("/mortgage-calculator") ? "text-blue-600" : "text-gray-700"}`}>Mortgage Calculator</Link>
            {user ? (
              <>
                <Link to="/profile" onClick={() => setIsOpen(false)} className="font-medium text-gray-700">Profile</Link>
                <Link to="/my-listings" onClick={() => setIsOpen(false)} className="font-medium text-gray-700">My Listings</Link>
                <Link to="/favourites" onClick={() => setIsOpen(false)} className="font-medium text-gray-700">Favourites</Link>
                <button onClick={handleLogout} className="font-medium text-red-600 text-left hover:bg-red-50 transition-colors rounded-md px-2 py-1">Logout</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setIsOpen(false)} className="font-medium text-blue-600">Sign In / Register</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
