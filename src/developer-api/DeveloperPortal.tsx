import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { organizationsApi } from '../config/developers-api';
import EnhancedLayout from './components/EnhancedLayout';
import OrganizationPage from './OrganizationPage';
import ProjectsPage from './ProjectsPage';
import OrganizationCreationForm from './OrganizationCreationForm';

type Organization = {
  id: number;
  name: string;
  description?: string;
  country: string;
  website?: string;
  email?: string;
  phone?: string;
  logo?: string;
  established?: number;
  created_at: string;
  updated_at: string;
};

export default function DeveloperPortal() {
  const location = useLocation();
  const { user, isLoading: authLoading } = useUser();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch organization data for layout purposes
  useEffect(() => {
    // Only fetch organization data if user is authenticated and is a developer
    if (authLoading || !user || !user.is_developer) {
      return;
    }

    const fetchOrganization = async () => {
      try {
        const response = await fetch('/api/dev/v1/orgs/mine/', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.organization) {
            setOrganization(data.organization);
          } else {
            // No organization found - show creation form
            setShowCreateForm(true);
          }
        } else if (response.status === 401) {
          setError('Authentication required. Please log in again.');
        } else {
          setError('Failed to fetch organization data.');
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
        setError('An error occurred while fetching organization data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganization();
  }, [user, authLoading]);

  const handleCreateOrganization = async (formData: Partial<Organization>) => {
    setIsCreating(true);
    try {
      const newOrg = await organizationsApi.create(formData);
      setOrganization(newOrg);
      setShowCreateForm(false);
      setError(null);
    } catch (error: any) {
      console.error('Error creating organization:', error);
      setError(error.response?.data?.error || 'Failed to create organization. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show error if user is not a developer
  if (!user || !user.is_developer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-4xl mb-4">🚫</div>
          <h3 className="text-lg font-medium mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-4">
            {!user ? 'You must be logged in to access the developer portal.' : 'You need developer access to use this portal. Please contact support to request developer status.'}
          </p>
          
          {/* Debug information */}
          {window.location.hostname === 'localhost' && (
            <div className="bg-gray-100 p-3 rounded text-left text-xs mb-4">
              <p><strong>Debug Info:</strong></p>
              <p>User: {user ? 'Yes' : 'No'}</p>
              <p>User ID: {user?.id || 'N/A'}</p>
              <p>Email: {user?.email || 'N/A'}</p>
              <p>Is Developer: {user?.is_developer ? 'Yes' : 'No'}</p>
              <p>Auth Loading: {authLoading ? 'Yes' : 'No'}</p>
            </div>
          )}
          
          <div className="space-y-3">
            {!user ? (
              <button 
                onClick={() => window.location.href = '/login'} 
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Login
              </button>
            ) : (
              <>
                <button 
                  onClick={() => window.location.href = '/developers'} 
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Go to Developers Page
                </button>
                <button 
                  onClick={() => window.location.href = '/contact'} 
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Request Developer Access
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show organization creation form if no organization exists
  if (showCreateForm) {
    return <OrganizationCreationForm onSubmit={handleCreateOrganization} isLoading={isCreating} />;
  }

  // Show loading while fetching organization data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading developer portal...</p>
        </div>
      </div>
    );
  }

  // Show error if organization fetch failed
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium mb-2">Unable to Load Portal</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show message if no organization found (fallback)
  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-4xl mb-4">🏢</div>
          <h3 className="text-lg font-medium mb-2">No Organization Found</h3>
          <p className="text-gray-600 mb-4">You need to create an organization to access the developer portal.</p>
          <button 
            onClick={() => setShowCreateForm(true)} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Organization
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <EnhancedLayout
        organization={organization}
        showBackButton={false}
        mainDashboardPath="/"
      >
        {/* Navigation Tabs - Responsive */}
        <div className="mb-6">
          <div className="flex justify-center sm:justify-start">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
              <Link
                to="/developer-api/organization"
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  location.pathname.includes('/organization') 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Organization
              </Link>
              <Link
                to="/developer-api/projects"
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  location.pathname.includes('/projects') 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Projects
              </Link>
            </div>
          </div>
        </div>

        {/* Route Content - Full width with proper responsive containers */}
        <div className="w-full">
          <Routes>
            <Route path="/organization" element={<OrganizationPage />} />
            <Route path="/projects/*" element={<ProjectsPage />} />
            <Route path="/" element={<ProjectsPage />} />
          </Routes>
        </div>
      </EnhancedLayout>
    </div>
  );
}