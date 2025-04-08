import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Search, User, ChevronDown, Building2, Plus } from "lucide-react";
import { useUser } from "../context/UserContext";
import axios from "axios";

interface ErrorResponse {
  data?: any;
  message?: string;
}

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, setUser } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      // Attempt to logout
      await axios.post(
        "https://propertprodjango.onrender.com/api/users/logout",
        {},
        { withCredentials: true } // Ensure cookies are included
      );
    } catch (error) {
      const err = error as { response?: ErrorResponse };
      console.error("Logout failed:", err.response?.data || "An error occurred during logout");
    } finally {
      // Always clear user state and redirect, even if logout API fails
      setUser(null);
      navigate("/login");
    }
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-md py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
              PROPERTPRO
            </span>
          </Link>

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
            <div className="relative group">
              <button className="flex items-center font-medium text-white-700 hover:text-blue-600 transition-colors">
                Services <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden transform scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-200 origin-top-left z-50">
                <Link
                  to="#"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                >
                  Mortgage Calculator
                </Link>
                <Link
                  to="#"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                >
                  Property Management
                </Link>
                <Link
                  to="#"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                >
                  Investment Advisory
                </Link>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Search className="h-5 w-5 text-white-700" />
            </button>

            {user ? (
              <>
                {/* Removed the Create Listing button */}
                <div className="relative group">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Welcome, {user.username}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
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
              </>
            ) : (
              <Link
                to="/account-selection"
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <User className="h-5 w-5" />
                <span>Account</span>
              </Link>
            )}
          </div>

          <button className="md:hidden p-2" onClick={toggleMenu}>
            {isOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden mt-4 bg-white rounded-lg shadow-lg p-4">
            <div className="flex flex-col space-y-4">
              <Link
                to="/"
                className={`font-medium ${
                  isActive("/") ? "text-blue-600" : "text-gray-700"
                }`}
              >
                Home
              </Link>
              <Link
                to="/buy"
                className={`font-medium ${
                  isActive("/buy") ? "text-blue-600" : "text-gray-700"
                }`}
              >
                Buy
              </Link>
              <Link
                to="/rent"
                className={`font-medium ${
                  isActive("/rent") ? "text-blue-600" : "text-gray-700"
                }`}
              >
                Rent
              </Link>
              {user ? (
                <>
                  <Link to="/profile" className="font-medium text-gray-700">
                    Profile
                  </Link>
                  <Link to="/my-listings" className="font-medium text-gray-700">
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
                <Link to="/account-selection" className="font-medium text-blue-600">
                  Account
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
