import React from 'react';
import { ChevronLeft, Home, Building2 } from 'lucide-react';

interface EnhancedLayoutProps {
  children: React.ReactNode;
  organization?: any;
  showBackButton?: boolean;
  onBack?: () => void;
  mainDashboardPath?: string;
  onNavigateHome?: () => void;
}

const EnhancedLayout: React.FC<EnhancedLayoutProps> = ({
  children,
  organization,
  showBackButton = false,
  onBack,
  onNavigateHome
}) => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col w-full overflow-x-hidden">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200/60 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              {showBackButton && (
                <button
                  onClick={onBack}
                  className="group p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200 flex-shrink-0 hover:shadow-sm"
                  title="Back"
                >
                  <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
                </button>
              )}
              
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-lg tracking-tight">Developer Portal</span>
                    <div className="hidden sm:block w-1 h-1 bg-slate-300 rounded-full"></div>
                    {organization?.name && (
                      <span className="text-sm font-medium text-slate-600 truncate hidden sm:block">
                        {organization.name}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-medium hidden md:block">Property Management System</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => (window.location.href = 'https://www.propertpro.com')}
                className="group inline-flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 flex-shrink-0 hover:-translate-y-0.5"
                title="Main Dashboard"
              >
                <Home className="h-4 w-4 text-slate-700 group-hover:text-slate-900 transition-colors" />
                <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 hidden lg:block transition-colors">
                  Dashboard
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full relative">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23f1f5f9%22 fill-opacity=%220.4%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%221.5%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
        
        <div className="relative w-full max-w-none px-4 py-8 sm:px-6 lg:px-8 xl:max-w-7xl xl:mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 border border-white/20 min-h-[calc(100vh-8rem)] p-6 sm:p-8 lg:p-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EnhancedLayout;