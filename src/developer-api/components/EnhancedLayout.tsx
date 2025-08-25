import React from 'react';
import { ChevronLeft, Home, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EnhancedLayoutProps {
  children: React.ReactNode;
  organization?: any;
  showBackButton?: boolean;
  onBack?: () => void;
  mainDashboardPath?: string;
}

const EnhancedLayout: React.FC<EnhancedLayoutProps> = ({
  children,
  organization,
  showBackButton = false,
  onBack,
  mainDashboardPath = '/'
}) => {

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full overflow-x-hidden">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {showBackButton && (
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                title="Back"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <span className="font-semibold text-gray-900 whitespace-nowrap">Dev Portal</span>
              {organization?.name && (
                <span className="text-sm text-gray-600 truncate hidden md:block">
                  {organization.name}
                </span>
              )}
            </div>
          </div>
          <Link
            to={mainDashboardPath}
            className="inline-flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex-shrink-0"
            title="Main Dashboard"
          >
            <Home className="h-4 w-4 text-gray-700" />
            <span className="text-sm font-medium text-gray-700 hidden lg:block">Main Dashboard</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full">
        <div className="w-full max-w-none px-4 py-6 md:px-6 lg:px-8 xl:max-w-7xl xl:mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default EnhancedLayout;
