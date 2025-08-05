import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Menu, X, User, ChevronDown, Building2, MessageCircle, Users, Search, 
  Home, ShoppingCart, Calendar, Calculator, TrendingUp, Star, List,
  Settings, LogOut, UserPlus
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { logout } from "../middleware/auth";
import { useChat } from "../context/ChatContext";
import { useConnections } from "../hooks/useConnections";
import UserSearch from './UserSearch';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, setUser, refreshUser, updateUserData } = useUser();
  const { threads, recalculateUnreadCounts } = useChat();
  const { pendingRequestsCount, totalConnectionsCount } = useConnections(!!user);
  const location = useLocation();
  const navigate = useNavigate();



  useEffect(() => {
    setIsOpen(false);
    setIsSearchOpen(false);
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Refresh notifications when user enters a chat thread
  useEffect(() => {
    if (location.pathname.startsWith('/chat/') && user) {
      // Force a refresh of the chat context when entering a specific chat thread
      // This will update the notification count as messages are marked as read
      recalculateUnreadCounts();
    }
  }, [location.pathname, user, recalculateUnreadCounts]);

  const isActive = (path: string) => location.pathname === path;
  const toggleMenu = () => setIsOpen(prev => !prev);
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
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

  // Count unread threads instead of total unread messages
  const unreadThreadsCount = threads.filter(t => t.unread_count > 0).length;
  
  // Use unread threads count for notifications (max 1 per thread)
  const notificationCount = unreadThreadsCount;

  // Handle chat link click to refresh notifications
  const handleChatClick = () => {
    setIsSidebarOpen(false);
    // Recalculate unread counts to refresh notifications
    recalculateUnreadCounts();
  };


  const navigationItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/buy", label: "Buy Properties", icon: ShoppingCart },
    { path: "/rent", label: "Rent Properties", icon: Calendar },
    { path: "/mortgage-calculator", label: "Mortgage Calculator", icon: Calculator },
    { path: "/rent-vs-buy", label: "Rent vs Buy", icon: TrendingUp },
  ];

  const userMenuItems = user ? [
    { path: "/profile", label: "Profile", icon: User },
    { path: "/my-listings", label: "My Listings", icon: List },
    { path: "/favourites", label: "Favourites", icon: Star },
    { path: "/connections", label: "Connections", icon: Users, badge: totalConnectionsCount },
  ] : [];

  return (
    <>
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-[9999] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                PROPERTPRO
              </span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* User Section */}
          {user && (
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900" title={user.username || user.email}>
                    {user.username || user.email || 'User'}
                  </h3>
                  <p className="text-sm text-gray-500"></p>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex space-x-2">
                <Link
                  to="/chat"
                  className="flex-1 flex items-center justify-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg transition-colors"
                  onClick={handleChatClick}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">Messages</span>
                  {notificationCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {notificationCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Navigation
              </h4>
              <nav className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* User Menu Items */}
            {user && (
              <div className="p-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Account
                </h4>
                <nav className="space-y-1">
                  {userMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                          isActive(item.path)
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        {item.badge && item.badge > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          {user && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="fixed w-full z-[9999] bg-white shadow-md pt-[env(safe-area-inset-top)]" style={{ height: 'var(--navbar-height)', transform: 'none !important', transition: 'none !important' }}>
        <div className="container mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Desktop Sidebar Toggle */}
            <button
              onClick={toggleSidebar}
              className="hidden md:block p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-6 w-6 text-gray-700" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent hidden sm:block">
                PROPERTPRO
              </span>
            </Link>
          </div>

          {/* Center - Search */}
          <div className="hidden md:flex flex-1 justify-center max-w-md mx-8">
            {user && <UserSearch />}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Mobile Sidebar Toggle - Only on mobile, positioned before other buttons */}
            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-6 w-6 text-gray-700" />
            </button>

            {/* Mobile Search */}
            {user && (
              <button
                onClick={toggleSearch}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Search"
              >
                <Search className="h-5 w-5 text-gray-700" />
              </button>
            )}

            {/* Messages */}
            {user && (
              <Link to="/chat" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={handleChatClick}>
                <MessageCircle className="h-5 w-5 text-gray-700" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Link>
            )}

            {/* User Menu */}
            {user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="hidden sm:block font-medium truncate max-w-[120px]" title={user.username || user.email}>
                    {user.username || user.email || 'User'}
                  </span>
                  <ChevronDown className="h-4 w-4 hidden sm:block" />
                </button>
                
                {/* Desktop Dropdown */}
                <div className="absolute right-0 mt-2 w-48 bg-white shadow-xl rounded-lg border border-gray-200 overflow-hidden transform scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-200 origin-top-right">
                  <div className="p-2">
                    <Link to="/profile" className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                    <Link to="/connections" className="flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Connections</span>
                      </div>
                      {totalConnectionsCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {totalConnectionsCount}
                        </span>
                      )}
                    </Link>
                    <Link to="/my-listings" className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                      <List className="h-4 w-4" />
                      <span>My Listings</span>
                    </Link>
                    <Link to="/favourites" className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                      <Star className="h-4 w-4" />
                      <span>Favourites</span>
                    </Link>
                    <div className="border-t border-gray-200 my-2"></div>
                    <button onClick={handleLogout} className="w-full flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors">
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/login" className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg">
                <UserPlus className="h-5 w-5" />
                <span className="hidden sm:block font-medium">Sign In / Register</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search Dropdown */}
        {isSearchOpen && user && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 z-20">
            <UserSearch />
          </div>
        )}
      </nav>


    </>
  );
};

export default Navbar;
