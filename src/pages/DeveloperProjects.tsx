import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Building2, 
  MapPin, 
  Search,
  Filter,
  ChevronRight,
  Star
} from "lucide-react";
import { motion } from "framer-motion";
import { Project } from "../types";

const DeveloperProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      
      try {
        // Mock API call - replace with actual API
        const mockProjects: Project[] = [
          {
            id: "1",
            developerId: "1",
            name: "City Views",
            description: "Luxury residential complex with stunning city and sea views, featuring modern architecture and premium amenities in the heart of Paphos.",
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
            description: "Exclusive waterfront development with private marina access, luxury finishes, and breathtaking Mediterranean views.",
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
          },
          {
            id: "3",
            developerId: "2",
            name: "Sunset Villas",
            description: "Premium villa collection with panoramic sunset views, private pools, and contemporary Mediterranean design.",
            location: "Ayia Napa",
            country: "Cyprus",
            status: "available",
            totalUnits: 12,
            availableUnits: 5,
            priceRange: {
              min: 650000,
              max: 950000,
              currency: "EUR"
            },
            propertyTypes: ["Villa"],
            amenities: ["Private Pool", "Garden", "Garage", "Sea View"],
            images: [
              "https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg?auto=compress&cs=tinysrgb&w=800"
            ],
            mainImage: "https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg?auto=compress&cs=tinysrgb&w=800",
            features: ["Sunset View", "Private Pool", "Modern Design"],
            createdAt: "2023-01-01",
            updatedAt: "2024-01-01"
          },
          {
            id: "4",
            developerId: "3",
            name: "Golden Coast Residences",
            description: "Beachfront residential complex offering luxury apartments with direct beach access and world-class amenities.",
            location: "Protaras",
            country: "Cyprus",
            status: "completed",
            totalUnits: 48,
            availableUnits: 3,
            priceRange: {
              min: 380000,
              max: 720000,
              currency: "EUR"
            },
            propertyTypes: ["Apartment", "Penthouse"],
            amenities: ["Beach Access", "Pool", "Gym", "Restaurant"],
            images: [
              "https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=800"
            ],
            mainImage: "https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=800",
            features: ["Beach Front", "Luxury Amenities", "Investment Opportunity"],
            createdAt: "2023-01-01",
            updatedAt: "2024-01-01"
          },
          {
            id: "5",
            developerId: "4",
            name: "Mountain View Estates",
            description: "Exclusive hillside development with panoramic mountain and valley views, featuring eco-friendly design and premium finishes.",
            location: "Troodos Mountains",
            country: "Cyprus",
            status: "planning",
            totalUnits: 18,
            availableUnits: 18,
            priceRange: {
              min: 520000,
              max: 890000,
              currency: "EUR"
            },
            propertyTypes: ["Villa", "Townhouse"],
            amenities: ["Mountain View", "Eco-Friendly", "Private Gardens", "Hiking Trails"],
            images: [
              "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800"
            ],
            mainImage: "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800",
            features: ["Mountain View", "Eco-Friendly", "Nature Setting"],
            createdAt: "2023-01-01",
            updatedAt: "2024-01-01"
          },
          {
            id: "6",
            developerId: "5",
            name: "Urban Loft Collection",
            description: "Contemporary loft-style apartments in the heart of Nicosia, perfect for modern urban living with premium amenities.",
            location: "Nicosia City Center",
            country: "Cyprus",
            status: "construction",
            totalUnits: 32,
            availableUnits: 15,
            priceRange: {
              min: 280000,
              max: 480000,
              currency: "EUR"
            },
            propertyTypes: ["Loft", "Apartment"],
            amenities: ["City Center", "Modern Design", "Rooftop Terrace", "Parking"],
            images: [
              "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800"
            ],
            mainImage: "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800",
            features: ["Urban Living", "Modern Lofts", "City Center"],
            createdAt: "2023-01-01",
            updatedAt: "2024-01-01"
          }
        ];

        setProjects(mockProjects);
        setFilteredProjects(mockProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    let filtered = projects;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(project => project.status === selectedStatus);
    }

    // Filter by location
    if (selectedLocation !== "all") {
      filtered = filtered.filter(project => 
        project.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, selectedStatus, selectedLocation]);

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "available", label: "Available" },
    { value: "construction", label: "Under Construction" },
    { value: "completed", label: "Completed" },
    { value: "planning", label: "Planning" }
  ];

  const locationOptions = [
    { value: "all", label: "All Locations" },
    { value: "paphos", label: "Paphos" },
    { value: "limassol", label: "Limassol" },
    { value: "ayia napa", label: "Ayia Napa" },
    { value: "protaras", label: "Protaras" },
    { value: "nicosia", label: "Nicosia" },
    { value: "troodos", label: "Troodos" }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="flex justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Developer Projects</h1>
          <p className="text-gray-600">Discover exceptional developments from Cyprus's leading property developers</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {locationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredProjects.length} of {projects.length} projects
          </p>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredProjects.map((project, index) => (
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
    <Link 
      to={`/projects/${project.id}`} 
      className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden group transform hover:-translate-y-2 block"
    >
      <div className="relative h-96 md:h-[500px] overflow-hidden">
        <img
          src={project.mainImage || project.images[0]}
          alt={project.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        <div className="absolute top-6 left-6">
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${statusColors[project.status]} backdrop-blur-sm`}>
            {statusLabels[project.status]}
          </span>
        </div>
        
        <div className="absolute top-6 right-6">
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/90 text-gray-800 backdrop-blur-sm">
            {project.country === 'Cyprus' ? '🇨🇾' : '🇬🇷'} {project.country}
          </span>
        </div>

        {/* Project Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 group-hover:text-blue-200 transition-colors duration-300">
              {project.name}
            </h2>
            <div className="flex items-center text-white/90 mb-4">
              <MapPin className="h-5 w-5 mr-2" />
              <span className="text-lg">{project.location}</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 border border-white/30">
            <ChevronRight className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
      
      <div className="p-8">
        <p className="text-gray-600 text-lg mb-6 leading-relaxed">
          {project.description}
        </p>

        {/* Property Types */}
        <div className="flex flex-wrap gap-3 mb-6">
          {project.propertyTypes.map((type, index) => (
            <span
              key={index}
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200"
            >
              {type}
            </span>
          ))}
        </div>
        
        {/* Amenities */}
        <div className="flex flex-wrap gap-2 mb-6">
          {project.amenities.slice(0, 4).map((amenity, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
            >
              {amenity}
            </span>
          ))}
          {project.amenities.length > 4 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              +{project.amenities.length - 4} more
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-8">
            <div>
              <span className="text-gray-500 text-sm block">Starting from</span>
              <span className="font-bold text-2xl text-gray-900">
                €{project.priceRange.min.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500 text-sm block">Total Units</span>
              <span className="font-semibold text-lg text-gray-900">
                {project.totalUnits}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Available Units</div>
            <div className="flex items-center">
              <span className="font-bold text-xl text-green-600 mr-2">
                {project.availableUnits}
              </span>
              <span className="text-gray-400">/ {project.totalUnits}</span>
            </div>
            <div className="w-24 bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(project.availableUnits / project.totalUnits) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DeveloperProjects;