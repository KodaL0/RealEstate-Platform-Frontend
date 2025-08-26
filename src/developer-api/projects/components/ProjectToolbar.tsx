import { useState } from 'react';
import { 
  Building2, 
  Image, 
  FileText, 
  Users, 
  BarChart3,
  Edit3,
  Trash2,
  Plus,
  Upload,
  Camera,
  ChevronRight,
  Settings
} from 'lucide-react';

interface ProjectToolbarProps {
  projectId: number;
  projectName: string;
  onViewChange: (view: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  stats: {
    units: number;
    assets: number;
    photos: number;
  };
  layout?: 'horizontal' | 'sidebar';
  showHeader?: boolean;
  showQuickActions?: boolean;
}

export default function ProjectToolbar({ 
  projectId, 
  projectName, 
  onViewChange, 
  onEdit, 
  onDelete,
  stats,
  layout = 'horizontal',
  showHeader = true,
  showQuickActions = true
}: ProjectToolbarProps) {
  const [activeView, setActiveView] = useState('overview');

  const handleViewChange = (view: string) => {
    setActiveView(view);
    onViewChange(view);
  };

  const toolbarItems = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: BarChart3, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50', 
      hoverBg: 'hover:bg-blue-100',
      activeBg: 'bg-blue-100',
      borderColor: 'border-blue-200'
    },
    { 
      id: 'units', 
      label: 'Units', 
      icon: Building2, 
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50', 
      hoverBg: 'hover:bg-emerald-100',
      activeBg: 'bg-emerald-100',
      borderColor: 'border-emerald-200',
      count: stats.units 
    },
    { 
      id: 'assets', 
      label: 'Assets', 
      icon: FileText, 
      color: 'text-violet-600',
      bgColor: 'bg-violet-50', 
      hoverBg: 'hover:bg-violet-100',
      activeBg: 'bg-violet-100',
      borderColor: 'border-violet-200',
      count: stats.assets 
    },
    { 
      id: 'photos', 
      label: 'Photos', 
      icon: Image, 
      color: 'text-amber-600',
      bgColor: 'bg-amber-50', 
      hoverBg: 'hover:bg-amber-100',
      activeBg: 'bg-amber-100',
      borderColor: 'border-amber-200',
      count: stats.photos 
    },
    { 
      id: 'team', 
      label: 'Team', 
      icon: Users, 
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50', 
      hoverBg: 'hover:bg-indigo-100',
      activeBg: 'bg-indigo-100',
      borderColor: 'border-indigo-200'
    }
  ];

  const quickActions = [
    { 
      label: 'Add Unit', 
      icon: Plus, 
      view: 'units', 
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      hoverBg: 'hover:bg-emerald-100'
    },
    { 
      label: 'Upload Asset', 
      icon: Upload, 
      view: 'assets', 
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      hoverBg: 'hover:bg-violet-100'
    },
    { 
      label: 'Add Photo', 
      icon: Camera, 
      view: 'photos', 
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      hoverBg: 'hover:bg-amber-100'
    }
  ];

  if (layout === 'sidebar') {
    return (
      <div className="w-80 h-full bg-white/95 backdrop-blur-sm border-r border-slate-200/60 shadow-xl shadow-slate-200/50 flex flex-col">
        {/* Project Header */}
        {showHeader && (
          <div className="p-6 border-b border-slate-200/60 bg-gradient-to-br from-slate-50/50 to-white/50">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-900 truncate">{projectName}</h3>
                <p className="text-sm text-slate-500 font-medium">Project #{projectId}</p>
              </div>
            </div>
            
            {/* Project Actions */}
            <div className="flex space-x-2">
              {onEdit && (
                <button 
                  onClick={onEdit} 
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </button>
              )}
              <button className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <div className="flex-1 p-4 space-y-2">
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Navigation</h4>
          </div>
          
          {toolbarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleViewChange(item.id)}
                className={`
                  group w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? `${item.activeBg} ${item.color} shadow-md shadow-slate-200/50 border ${item.borderColor}` 
                    : `text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-200 hover:shadow-sm`}
                `}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-5 w-5 transition-colors ${isActive ? item.color : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {item.count !== undefined && (
                    <span className={`
                      inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold rounded-full
                      ${isActive 
                        ? 'bg-white/90 text-slate-700' 
                        : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'}
                    `}>
                      {item.count}
                    </span>
                  )}
                  <ChevronRight className={`h-4 w-4 transition-all duration-200 ${isActive ? item.color : 'text-slate-300 group-hover:text-slate-400'}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        {showQuickActions && (
          <div className="p-4 border-t border-slate-200/60 bg-gradient-to-br from-slate-50/30 to-white/30">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h4>
            <div className="space-y-2">
              {quickActions.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <button 
                    key={action.label}
                    onClick={() => handleViewChange(action.view)} 
                    className={`
                      group w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg
                      transition-all duration-200 ${action.color} ${action.bgColor} ${action.hoverBg}
                      border border-transparent hover:border-slate-200 hover:shadow-sm
                    `}
                  >
                    <ActionIcon className="h-4 w-4" />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Horizontal Layout (Improved)
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-xl shadow-slate-200/50">
      {/* Project Header */}
      {showHeader && (
        <div className="px-8 py-6 border-b border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-white/50 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{projectName}</h3>
                <p className="text-sm text-slate-500 font-medium">Project #{projectId}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {onEdit && (
                <button 
                  onClick={onEdit} 
                  className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Project
                </button>
              )}
              {onDelete && (
                <button 
                  onClick={onDelete} 
                  className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="px-8 py-6">
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
          {toolbarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleViewChange(item.id)}
                className={`
                  group flex items-center space-x-3 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap
                  ${isActive 
                    ? `${item.activeBg} ${item.color} shadow-lg shadow-slate-200/50 border ${item.borderColor} scale-105` 
                    : `text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-200 hover:shadow-md hover:-translate-y-0.5`}
                `}
              >
                <Icon className={`h-5 w-5 transition-colors ${isActive ? item.color : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span className={`
                    inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold rounded-full
                    ${isActive 
                      ? 'bg-white/90 text-slate-700 shadow-sm' 
                      : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'}
                  `}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      {showQuickActions && (
        <div className="px-8 py-6 border-t border-slate-200/60 bg-gradient-to-r from-slate-50/30 to-white/30 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-500">Quick Actions</h4>
            <div className="flex items-center space-x-2">
              {quickActions.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <button 
                    key={action.label}
                    onClick={() => handleViewChange(action.view)} 
                    className={`
                      group inline-flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-xl
                      transition-all duration-200 ${action.color} ${action.bgColor} ${action.hoverBg}
                      border border-transparent hover:border-slate-200 hover:shadow-md hover:-translate-y-0.5
                    `}
                  >
                    <ActionIcon className="h-4 w-4" />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}