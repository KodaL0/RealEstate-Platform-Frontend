import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, ChevronDown, Building2 } from "lucide-react";
import { useUser } from "../context/UserContext";
import { apiClient } from "../middleware/auth";

/* -------------------------------------------------------------------------- */
/*  NAVBAR COMPONENT                                                          */
/* -------------------------------------------------------------------------- */

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, setUser } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  /* -----  add / remove shadow on scroll  ---------------------------------- */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* -----  close mobile menu on route-change  ------------------------------ */
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  /* ----------------------------- helpers ---------------------------------- */
  const isActive = (path: string) => location.pathname === path;
  const toggleMenu = () => setIsOpen((prev) => !prev);

  const handleLogout = async () => {
    try {
      await apiClient.post("/users/logout");
    } catch (_) {
      /* ignore – we’ll still clear local state */
    } finally {
      setUser(null);
      navigate("/login");
    }
  };

  /* ------------------------------------------------------------------------ */
  /*  RENDER                                                                  */
  /* ------------------------------------------------------------------------ */
  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-md py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        {/* ------------------------------------------------------------------ */}
        {/*  TOP ROW                                                           */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex justify-between items-center">
          {/* ─── Logo / Brand ─────────────────────────────────────────────── */}
          <Link to="/" className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
              PROPERTPRO
            </span>
          </Link>

          {/* ─── Desktop links (≥ md) ─────────────────────────────────────── */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`font-medium ${
                isActive("/") ? "text-blue-600" : "text-white-700 hover:text-blue-600"
              } transition-colors`}
            >
              Home
            </Link>

            <Link
              to="/buy"
              className={`font-medium ${
                isActive("/buy") ? "text-blue-600" : "text-white-700 hover:text-blue-600"
              } transition-colors`}
            >
              Buy
            </Link>

            <Link
              to="/rent"
              className={`font-medium ${
                isActive("/rent") ? "text-blue-600" : "text-white-700 hover:text-blue-600"
              } transition-colors`}
            >
              Rent
            </Link>

            {/* ─── Services dropdown (desktop only) ──────────────────────── */}
            <div className="relative group">
              <button className="flex items-center font-medium text-white-700 hover:text-blue-600 transition-colors">
                Services <ChevronDown className="ml-1 h-4 w-4" />
              </button>

              {/* dropdown */}
              <div className="absolute left-0 mt-2 w-56 bg-white shadow-lg rounded-md overflow-hidden transform scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-200 origin-top-left z-50">
                {/* ▾▾▾  ONLY Mortgage Calculator kept  ▾▾▾ */}
                <Link
                  to="/mortgage-calculator"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                >
                  Mortgage Calculator
                </Link>
              </div>
            </div>
          </div>

          {/* ─── Auth area (desktop) ──────────────────────────────────────── */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative group">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Hello, {user.username}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {/* user dropdown */}
                <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden transform scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-200 origin-top-right z-50">
                  <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-blue-50">
                    Profile
                  </Link>
                  <Link to="/my-listings" className="block px-4 py-2 text-gray-700 hover:bg-blue-50">
                    My Listings
                  </Link>
                  <button
                    onMouseDown={handleLogout}
                    className="w-full text-left block px-4 py-2 text-gray-700 hover:bg-blue-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <User className="h-5 w-5" />
                <span>Sign In / Register</span>
              </Link>
            )}
          </div>

          {/* ─── Hamburger (mobile) ──────────────────────────────────────── */}
          <button className="md:hidden p-2" onClick={toggleMenu}>
            {isOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/*  MOBILE MENU (only when isOpen)                                    */}
        {/* ------------------------------------------------------------------ */}
        {isOpen && (
          <div className="md:hidden mt-4 bg-white rounded-lg shadow-lg p-4">
            <div className="flex flex-col space-y-4">
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className={`font-medium ${isActive("/") ? "text-blue-600" : "text-gray-700"}`}
              >
                Home
              </Link>

              <Link
                to="/buy"
                onClick={() => setIsOpen(false)}
                className={`font-medium ${isActive("/buy") ? "text-blue-600" : "text-gray-700"}`}
              >
                Buy
              </Link>

              <Link
                to="/rent"
                onClick={() => setIsOpen(false)}
                className={`font-medium ${isActive("/rent") ? "text-blue-600" : "text-gray-700"}`}
              >
                Rent
              </Link>

              {/* ▸ NEW – Mortgage Calculator link visible on mobile */}
              <Link
                to="/mortgage-calculator"
                onClick={() => setIsOpen(false)}
                className={`font-medium ${
                  isActive("/mortgage-calculator") ? "text-blue-600" : "text-gray-700"
                }`}
              >
                Mortgage Calculator
              </Link>

              {/* auth links (mobile) */}
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="font-medium text-gray-700"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/my-listings"
                    onClick={() => setIsOpen(false)}
                    className="font-medium text-gray-700"
                  >
                    My Listings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="font-medium text-gray-700 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="font-medium text-blue-600"
                >
                  Sign In / Register
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
