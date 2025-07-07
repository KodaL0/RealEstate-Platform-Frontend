import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, ChevronDown, Building2, MessageCircle, Users, Search } from "lucide-react";
import { useUser } from "../context/UserContext";
import { logout } from "../middleware/auth";
import { useChat } from "../context/ChatContext";
import { useConnections } from "../hooks/useConnections";
import UserSearch from './UserSearch';
import { RequireAuth } from './RequireAuth';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, setUser } = useUser();
  const { threads } = useChat();
  const { pendingRequestsCount } = useConnections(!!user);
  const location = useLocation();
  const navigate = useNavigate();

  // Debug logging
  console.log("Navbar render - user:", user);
  console.log("Navbar render - user?.username:", user?.username);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;
  const toggleMenu = () => setIsOpen(prev => !prev);
  const toggleSearch = () => setIsSearchOpen(prev => !prev);

  const handleLogout = async () => {
    try {
      sessionStorage.clear();
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.toLowerCase().includes('google') || key.toLowerCase().includes('oauth') || key.toLowerCase().includes('token'))) {
          localStorage.removeItem(key);
        }
      }

      await logout();
      
      setUser(null);
      
      navigate("/login");
      
      console.log("Logout completed successfully");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const unreadTotal = threads.reduce((sum, t) => sum + t.unread_count, 0);
  const isOnChatPage = location.pathname.startsWith('/chat');

  return (
    <>
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? "bg-white shadow-md" : "bg-transparent"} pt-[env(safe-area-inset-top)] h-[calc(4rem+env(safe-area-inset-top))]`}
      >
        <div className="container mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          {/* Left Section: Logo + Search */}
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                PROPERTPRO
              </span>
            </Link>

            {/* Desktop Search */}
            <RequireAuth>
              <div className="hidden md:block">
                <UserSearch />
              </div>
            </RequireAuth>

            {/* Mobile Search Icon */}
            <RequireAuth>
              <button
                onClick={toggleSearch}
                className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
                aria-label="Search users"
              >
                <Search className="h-5 w-5" />
              </button>
            </RequireAuth>
          </div>

          {/* Center Navigation Links */}
          <div className="hidden lg:flex space-x-8">
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
                <Link to="/rent-vs-buy" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                  Rent vs Buy Calculator
                </Link>
              </div>
            </div>
          </div>

          {/* Right Section: User Menu */}
          <div className="flex items-center space-x-2">
            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center">
              {user ? (
                <>
                  <Link to="/chat" className="relative mr-4">
                    <MessageCircle className="h-6 w-6 text-white-700 hover:text-blue-600" />
                    {unreadTotal > 0 && (
                      <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs rounded-full px-1">
                        {unreadTotal}
                      </span>
                    )}
                  </Link>
                  <div className="relative group max-w-[280px]">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 max-w-full overflow-hidden">
                      <User className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate max-w-[160px]" title={user.username}>
                        {user.username}
                      </span>
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden transform scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-200 origin-top-right z-50">
                      <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-blue-50">Profile</Link>
                      <Link to="/connections" className="flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-blue-50">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Connections
                        </div>
                        {pendingRequestsCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {pendingRequestsCount}
                          </span>
                        )}
                      </Link>
                      <Link to="/my-listings" className="block px-4 py-2 text-gray-700 hover:bg-blue-50">My Listings</Link>
                      <Link to="/favourites" className="block px-4 py-2 text-gray-700 hover:bg-blue-50">Favourites</Link>
                      <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-red-600 hover:bg-red-50 transition-colors">Logout</button>
                    </div>
                  </div>
                </>
              ) : (
                <Link to="/login" className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <User className="h-5 w-5" />
                  <span>Sign In / Register</span>
                </Link>
              )}
            </div>

            {/* Mobile Messages Button - Show when user is logged in and not on chat page */}
            {user && !isOnChatPage && (
              <Link 
                to="/chat" 
                className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
                aria-label="Messages"
              >
                <div className="relative">
                  <MessageCircle className="h-6 w-6" />
                  {unreadTotal > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center text-[10px]">
                      {unreadTotal > 9 ? '9+' : unreadTotal}
                    </span>
                  )}
                </div>
              </Link>
            )}

            {/* Mobile Toggle */}
            <button 
              className="md:hidden p-2 tap-target" 
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Dropdown */}
        {isSearchOpen && (
          <RequireAuth>
            <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 z-40">
              <UserSearch />
            </div>
          </RequireAuth>
        )}

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white rounded-b-lg shadow-lg border-t border-gray-200 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-4 py-4 space-y-1">
              <Link to="/" onClick={() => setIsOpen(false)} className={`block py-3 px-2 rounded-lg font-medium transition-colors ${isActive("/") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-50"}`}>
                Home
              </Link>
              <Link to="/buy" onClick={() => setIsOpen(false)} className={`block py-3 px-2 rounded-lg font-medium transition-colors ${isActive("/buy") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-50"}`}>
                Buy
              </Link>
              <Link to="/rent" onClick={() => setIsOpen(false)} className={`block py-3 px-2 rounded-lg font-medium transition-colors ${isActive("/rent") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-50"}`}>
                Rent
              </Link>
              
              {/* Services Section */}
              <div className="border-t border-gray-100 pt-2 mt-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1 mb-1">Services</div>
                <Link to="/mortgage-calculator" onClick={() => setIsOpen(false)} className={`block py-3 px-2 rounded-lg font-medium transition-colors ${isActive("/mortgage-calculator") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-50"}`}>
                  Mortgage Calculator
                </Link>
                <Link to="/rent-vs-buy" onClick={() => setIsOpen(false)} className={`block py-3 px-2 rounded-lg font-medium transition-colors ${isActive("/rent-vs-buy") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-50"}`}>
                  Rent vs Buy Calculator
                </Link>
              </div>

              {user ? (
                <>
                  {/* User Section */}
                  <div className="border-t border-gray-100 pt-2 mt-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1 mb-1">Account</div>
                    
                    {/* Messages - Prominent placement */}
                    <Link 
                      to="/chat" 
                      onClick={() => setIsOpen(false)} 
                      className={`flex items-center justify-between py-3 px-2 rounded-lg font-medium transition-colors ${location.pathname.startsWith("/chat") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      <div className="flex items-center">
                        <MessageCircle className="h-5 w-5 mr-3" />
                        Messages
                      </div>
                      {unreadTotal > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {unreadTotal > 99 ? '99+' : unreadTotal}
                        </span>
                      )}
                    </Link>
                    
                    <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center py-3 px-2 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      <User className="h-5 w-5 mr-3" />
                      Profile
                    </Link>
                    
                    <Link to="/connections" onClick={() => setIsOpen(false)} className="flex items-center justify-between py-3 px-2 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 mr-3" />
                        Connections
                      </div>
                      {pendingRequestsCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {pendingRequestsCount}
                        </span>
                      )}
                    </Link>
                    
                    <Link to="/my-listings" onClick={() => setIsOpen(false)} className="block py-3 px-2 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      My Listings
                    </Link>
                    
                    <Link to="/favourites" onClick={() => setIsOpen(false)} className="block py-3 px-2 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      Favourites
                    </Link>
                    
                    <button 
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }} 
                      className="w-full text-left py-3 px-2 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="border-t border-gray-100 pt-2 mt-2">
                  <Link 
                    to="/login" 
                    onClick={() => setIsOpen(false)} 
                    className="flex items-center justify-center py-3 px-4 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <User className="h-5 w-5 mr-2" />
                    Sign In / Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Floating Chat Button - Only show when user is logged in and not on chat page */}
      {user && !isOnChatPage && (
        <Link
          to="/chat"
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 z-40 flex items-center justify-center md:hidden"
          aria-label="Open messages"
        >
          <div className="relative">
            <MessageCircle size={24} />
            {unreadTotal > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center text-[10px]">
                {unreadTotal > 9 ? '9+' : unreadTotal}
              </span>
            )}
          </div>
        </Link>
      )}
    </>
  );
};

export default Navbar;
