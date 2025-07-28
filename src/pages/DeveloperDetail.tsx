import {
  useState,
  useEffect,
} from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Star, 
  Award, 
  Phone, 
  Mail, 
  Globe, 
  ArrowLeft,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Developer, Project } from "../types";
import api from "../config/api";

const DeveloperDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'contact'>('overview');

  useEffect(() => {
    const fetchDeveloperData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);

      try {
        // Mock API calls - replace with actual API
        const mockDeveloper: Developer = {
          id: "1",
          name: "Premium Developments Ltd",
          description: "Premium Developments Ltd is a leading luxury property developer in Cyprus with over 20 years of experience in creating exceptional residential and commercial properties. We specialize in high-end developments that combine modern architecture with Mediterranean charm.",
          established: 2003,
          location: "Limassol",
          country: "Cyprus",
          website: "https://premiumdev.com",
          email: "info@premiumdev.com",
          phone: "+357 25 123456",
          totalProjects: 25,
          activeProjects: 5,
          completedProjects: 20,
          specialties: ["Luxury Villas", "Residential Complexes", "Commercial", "Waterfront Properties"],
          rating: 4.8,
          reviewCount: 156,
          image: "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1200",
          createdAt: "2023-01-01",
          updatedAt: "2024-01-01"
        };

        const mockProjects: Project[] = [
          {
            id: "1",
            developerId: "1",
            name: "City Views",
            description: "Luxury residential complex with stunning city and sea views",
            location: "Paphos, Konia",
            country: "Cyprus",
            status: "available",
            totalUnits: 24,
            availableUnits: 8,
            priceRange: {
              min: 450000,
              max: 850000,
              currency: "EUR"
            },
            propertyTypes: ["Villa", "Apartment"],
            amenities: ["Swimming Pool", "Gym", "Security", "Parking"],
            images: [
              "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800",
              "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800"
            ],
            mainImage: "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800",
            features: ["Sea View", "Modern Design", "Energy Efficient"],
            createdAt: "2023-01-01",
            updatedAt: "2024-01-01"
          },
          {
            id: "2",
            developerId: "1",
            name: "Marina Heights",
            description: "Exclusive waterfront development with private marina access",
            location: "Limassol Marina",
            country: "Cyprus",
            status: "construction",
            totalUnits: 36,
            availableUnits: 12,
            priceRange: {
              min: 750000,
              max: 1500000,
              currency: "EUR"
            },
            propertyTypes: ["Penthouse", "Apartment"],
            amenities: ["Marina Access", "Concierge", "Spa", "Restaurant"],
            images: [
              "https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=800"
            ],
            mainImage: "https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=800",
            features: ["Marina View", "Luxury Finishes", "Smart Home"],
            createdAt: "2023-01-01",
            updatedAt: "2024-01-01"
          }
        ];

        setDeveloper(mockDeveloper);
        setProjects(mockProjects);
      } catch (err) {
        console.error("Error fetching developer data:", err);
        setError("Failed to fetch developer information. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeveloperData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="flex justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading developer information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !developer) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-semibold">!</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading developer</h3>
                <p className="mt-1 text-sm text-red-700">{error || "Developer not found"}</p>
                <Link
                  to="/developers"
                  className="mt-3 inline-block px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm font-medium transition-colors"
                >
                  Back to Developers
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'projects', label: `Projects (${projects.length})` },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-96 bg-gray-900 pt-20">
        <div className="absolute inset-0">
          <img
            src={developer.image}
            alt={developer.name}
            className="w-full h-full object-cover opacity-60"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-8">
          <div className="text-white">
            <Link
              to="/developers"
              className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Developers
            </Link>
            <h1 className="text-4xl font-bold mb-2">{developer.name}</h1>
            <div className="flex items-center space-x-6 text-white/90">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{developer.location}, {developer.country}</span>
              </div>
              {developer.established && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Est. {developer.established}</span>
                </div>
              )}
              {developer.rating && (
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-2 text-yellow-400 fill-current" />
                  <span>{developer.rating} ({developer.reviewCount} reviews)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">About {developer.name}</h2>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {developer.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Specialties</h3>
                        <div className="flex flex-wrap gap-2">
                          {developer.specialties.map((specialty, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Experience</h3>
                        <p className="text-gray-600">
                          {developer.established && `${new Date().getFullYear() - developer.established} years`} of excellence in property development
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Stats Card */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Project Statistics</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Award className="h-5 w-5 text-blue-600 mr-2" />
                          <span className="text-gray-600">Total Projects</span>
                        </div>
                        <span className="font-semibold text-gray-900">{developer.totalProjects}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Building2 className="h-5 w-5 text-green-600 mr-2" />
                          <span className="text-gray-600">Active Projects</span>
                        </div>
                        <span className="font-semibold text-gray-900">{developer.activeProjects}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Star className="h-5 w-5 text-yellow-500 mr-2" />
                          <span className="text-gray-600">Completed</span>
                        </div>
                        <span className="font-semibold text-gray-900">{developer.completedProjects}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Quick Contact</h3>
                    <div className="space-y-3">
                      {developer.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 mr-3" />
                          <a href={`tel:${developer.phone}`} className="text-blue-600 hover:text-blue-700">
                            {developer.phone}
                          </a>
                        </div>
                      )}
                      {developer.email && (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-gray-400 mr-3" />
                          <a href={`mailto:${developer.email}`} className="text-blue-600 hover:text-blue-700">
                            {developer.email}
                          </a>
                        </div>
                      )}
                      {developer.website && (
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 text-gray-400 mr-3" />
                          <a 
                            href={developer.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'projects' && (
            <motion.div
              key="projects"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Projects by {developer.name}</h2>
                <p className="text-gray-600">Explore our portfolio of exceptional developments</p>
              </div>

              {projects.length === 0 ? (
                <div className="text-center py-16">
                  <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects available</h3>
                  <p className="text-gray-600">This developer hasn't published any projects yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {projects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ProjectCard project={project} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact {developer.name}</h2>
                
                <div className="bg-white rounded-xl shadow-sm p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Get in Touch</h3>
                      <div className="space-y-4">
                        {developer.phone && (
                          <div className="flex items-center">
                            <Phone className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <p className="text-sm text-gray-500">Phone</p>
                              <a href={`tel:${developer.phone}`} className="text-blue-600 hover:text-blue-700 font-medium">
                                {developer.phone}
                              </a>
                            </div>
                          </div>
                        )}
                        {developer.email && (
                          <div className="flex items-center">
                            <Mail className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <p className="text-sm text-gray-500">Email</p>
                              <a href={`mailto:${developer.email}`} className="text-blue-600 hover:text-blue-700 font-medium">
                                {developer.email}
                              </a>
                            </div>
                          </div>
                        )}
                        {developer.website && (
                          <div className="flex items-center">
                            <Globe className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <p className="text-sm text-gray-500">Website</p>
                              <a 
                                href={developer.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Visit Website
                              </a>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Location</p>
                            <p className="font-medium text-gray-900">{developer.location}, {developer.country}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Quick Facts</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Established</p>
                          <p className="font-medium text-gray-900">{developer.established}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Projects</p>
                          <p className="font-medium text-gray-900">{developer.totalProjects}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Rating</p>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="font-medium text-gray-900">{developer.rating}</span>
                            <span className="text-gray-500 ml-1">({developer.reviewCount} reviews)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Project Card Component
const ProjectCard = ({ project }: { project: Project }) => {
  const statusColors = {
    planning: 'bg-yellow-100 text-yellow-800',
    construction: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    available: 'bg-purple-100 text-purple-800'
  };

  const statusLabels = {
    planning: 'Planning',
    construction: 'Under Construction',
    completed: 'Completed',
    available: 'Available'
  };

  return (
    <Link to={`/project/${project.id}`} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <div className="relative h-64 overflow-hidden">
        <img
          src={project.mainImage || project.images[0]}
          alt={project.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
            {statusLabels[project.status]}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/90 text-gray-800">
            {project.country === 'Cyprus' ? '🇨🇾' : '🇬🇷'} {project.country}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {project.name}
          </h3>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </div>
        
        <div className="flex items-center text-gray-600 mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">{project.location}</span>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
        
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-gray-500">From </span>
            <span className="font-semibold text-gray-900">
              €{project.priceRange.min.toLocaleString()}
            </span>
          </div>
          <div className="text-gray-500">
            {project.availableUnits} of {project.totalUnits} available
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DeveloperDetail;
