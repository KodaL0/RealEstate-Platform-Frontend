import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate, useMatch } from 'react-router-dom';
import ProjectCard from './projects/components/ProjectCard';
import ProjectManagement from './projects/components/ProjectManagement';
import ProjectCreationModal from './components/ProjectCreationModal';
import ProjectToolbar from './projects/components/ProjectToolbar';
import developersApi, { Project } from '../config/developers-api';
import developerPortalApi from './services/DeveloperPortalApi';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-()]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const projectMatch = useMatch('/developer-api/projects/:projectSlug/:tab?');

  const [projectSection, setProjectSection] = useState<'overview' | 'preview' | 'units' | 'assets' | 'photos' | 'team'>('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const [slugById, setSlugById] = useState<Record<number, string>>({});
  const [projectStats, setProjectStats] = useState<Record<number, { unitsCount: number; assetsCount: number; photosCount: number; firstPhotoUrl?: string }>>({});

  // Build unique slugs using project names. Duplicates become name(2), name(3), ...
  const buildUniqueSlugs = (items: Project[]): Record<number, string> => {
    const used: Record<string, number> = {};
    const result: Record<number, string> = {};
    for (const p of items) {
      const base = slugify(p.name) || `project-${p.id}`;
      const count = used[base] || 0;
      const slug = count === 0 ? base : `${base}(${count + 1})`;
      used[base] = count + 1;
      result[p.id] = slug;
    }
    return result;
  };

  // Fetch projects and organization using centralized API service
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use centralized portal API service
        const portalData = await developerPortalApi.initialize();
        
        if (portalData.organization) {
          setOrganizationId(portalData.organization.id);
          setProjects(portalData.projects);
          setSlugById(buildUniqueSlugs(portalData.projects));
          setProjectStats(portalData.projectStats);
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        console.error('Error details:', error?.response);
        console.error('Error message:', error?.message);
        console.error('Error status:', error?.response?.status);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // When the route has :projectSlug/:tab, set section and resolve project by slug
  useEffect(() => {
    const loadFromRoute = async () => {
      const routeSlug = projectMatch?.params.projectSlug;
      const tab = (projectMatch?.params.tab as any) || 'overview';
      if (!routeSlug) {
        setActiveProject(null);
        return;
      }
      setProjectSection(tab);

      // Find id by slug
      const id = Object.entries(slugById).find(([, s]) => s === routeSlug)?.[0];
      if (id) {
        const found = projects.find(p => String(p.id) === String(id));
        if (found) {
          setActiveProject(found);
          return;
        }
      }

      // Fallback: try fetch all projects again (in case of refresh before list loaded)
      if (!projects.length) {
        try {
          const resp = await developersApi.projects.list();
          const items = resp || [];
          const map = buildUniqueSlugs(items);
          setProjects(items);
          setSlugById(map);
          const resolved = items.find(p => map[p.id] === routeSlug) || null;
          setActiveProject(resolved);
        } catch (e) {
          console.error('Failed to resolve project by slug', e);
        }
      }
    };
    loadFromRoute();
  }, [projectMatch, projects, slugById]);

  const navigateToProjectTab = (project: Project, view: string) => {
    const slug = slugById[project.id] || slugify(project.name);
    navigate(`/developer-api/projects/${slug}/${view}`);
  };

  const handleProjectClick = (project: Project) => {
    navigateToProjectTab(project, 'overview');
  };

  const handleProjectViewChange = (view: string) => {
    if (activeProject) {
      setProjectSection(view as any);
      navigateToProjectTab(activeProject, view);
    }
  };

  const handleBackToProjects = () => {
    navigate('/developer-api/projects');
  };

  const handleProjectCreated = async (newProject: Project) => {
    // Add to portal API cache
    await developerPortalApi.addProject(newProject);
    
    // Update local state
    setProjects(prev => {
      const next = [...prev, newProject];
      setSlugById(buildUniqueSlugs(next));
      return next;
    });
    
    // Update stats
    const stats = await developerPortalApi.getProjectStats(newProject.id);
    if (stats) {
      setProjectStats(prev => ({
        ...prev,
        [newProject.id]: stats,
      }));
    }
  };

  const handleProjectUpdate = async (updatedProject: Project) => {
    // Update portal API cache
    await developerPortalApi.updateProject(updatedProject);
    
    // Update local state
    setProjects(prev => {
      const next = prev.map(p => p.id === updatedProject.id ? updatedProject : p);
      return next;
    });
    
    // Update stats
    const stats = await developerPortalApi.getProjectStats(updatedProject.id);
    if (stats) {
      setProjectStats(prev => ({
        ...prev,
        [updatedProject.id]: stats,
      }));
    }
    
    // Also update the active project if it's the one being updated
    if (activeProject && activeProject.id === updatedProject.id) {
      setActiveProject(updatedProject);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  // Detail view when route has a project slug
  if (activeProject) {
    return (
      <div className="w-full max-w-none">
        <div className="mb-4">
          <button
            onClick={handleBackToProjects}
            className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to Projects
          </button>
        </div>

        {/* Project Tabs */}
        <div className="mb-4">
          <ProjectToolbar
            projectId={activeProject.id}
            projectName={activeProject.name}
            onViewChange={handleProjectViewChange}
            activeView={projectSection}
            stats={{
              units: projectStats[activeProject.id]?.unitsCount || 0,
              assets: projectStats[activeProject.id]?.assetsCount || 0,
              photos: projectStats[activeProject.id]?.photosCount || 0,
            }}
            compact={false}
            showHeader={false}
            showQuickActions={false}
          />
        </div>

        <ProjectManagement 
          project={activeProject} 
          activeSection={projectSection} 
          onProjectUpdate={handleProjectUpdate}
          onViewChange={handleProjectViewChange}
        />
      </div>
    );
  }

  // List view
  return (
    <div className="w-full max-w-none">
      {/* Header Section - Responsive */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-8">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Projects</h1>
          <p className="text-gray-600 text-sm md:text-base">Manage your development projects</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          <Plus className="h-5 w-5 mr-2" />
          <span className="whitespace-nowrap">Create Project</span>
        </button>
      </div>

      {/* Content Area - Full responsive */}
      <div className="w-full">
        {projects.length === 0 ? (
          <div className="text-center py-16 md:py-24">
            <div className="text-6xl md:text-8xl mb-6">🏗️</div>
            <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900">No Projects Yet</h3>
            <p className="text-gray-600 mb-8 text-base md:text-lg max-w-md mx-auto">
              Create your first project to start managing your development portfolio
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg font-medium text-lg"
            >
              <Plus className="h-6 w-6 mr-3" />
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {projects.map(project => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onClick={handleProjectClick}
                onViewChange={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
                preloadedStats={projectStats[project.id]}
              />
            ))}
          </div>
        )}
      </div>

      {/* Project Creation Modal */}
      {organizationId && (
        <ProjectCreationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onProjectCreated={handleProjectCreated}
          organizationId={organizationId}
        />
      )}
    </div>
  );
}
