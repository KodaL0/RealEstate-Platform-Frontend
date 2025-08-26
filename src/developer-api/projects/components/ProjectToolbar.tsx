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
  Camera
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
  compact?: boolean;
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
  compact = false,
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
      color: 'text-slate-700', 
      activeColor: 'text-blue-700',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100', 
      hoverBg: 'hover:bg-slate-50',
      borderColor: 'ring-blue-200'
    },
    { 
      id: 'units', 
      label: 'Units', 
      icon: Building2, 
      color: 'text-slate-700', 
      activeColor: 'text-emerald-700',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100', 
      hoverBg: 'hover:bg-slate-50',
      borderColor: 'ring-emerald-200',
      count: stats.units 
    },
    { 
      id: 'assets', 
      label: 'Assets', 
      icon: FileText, 
      color: 'text-slate-700', 
      activeColor: 'text-violet-700',
      bgColor: 'bg-gradient-to-br from-violet-50 to-violet-100', 
      hoverBg: 'hover:bg-slate-50',
      borderColor: 'ring-violet-200',
      count: stats.assets 
    },
    { 
      id: 'photos', 
      label: 'Photos', 
      icon: Image, 
      color: 'text-slate-700', 
      activeColor: 'text-amber-700',
      bgColor: 'bg-gradient-to-br from-amber-50 to-amber-100', 
      hoverBg: 'hover:bg-slate-50',
      borderColor: 'ring-amber-200',
      count: stats.photos 
    },
    { 
      id: 'team', 
      label: 'Team', 
      icon: Users, 
      color: 'text-slate-700', 
      activeColor: 'text-indigo-700',
      bgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100', 
      hoverBg: 'hover:bg-slate-50',
      borderColor: 'ring-indigo-200'
    }
  ];

  const quickActions = [
    { label: 'Add Unit', icon: Plus, view: 'units', color: 'text-emerald-600 hover:text-emerald-700' },
    { label: 'Upload Asset', icon: Upload, view: 'assets', color: 'text-violet-600 hover:text-violet-700' },
    { label: 'Add Photo', icon: Camera, view: 'photos', color: 'text-amber-600 hover:text-amber-700' }
  ];

  return (
    <div className={`${compact ? 'bg-transparent border-0 rounded-none' : 'bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50'}`}>
      {/* Project Info Header */}
      {showHeader && !compact && (
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-lg">{projectName}</h4>
                  <span className="text-sm text-slate-500 font-medium">Project #{projectId}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {onEdit && (
                <button 
                  onClick={onEdit} 
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm border border-slate-200 rounded-lg transition-all duration-200 ease-in-out"
                  title="Edit Project"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </button>
              )}
              {onDelete && (
                <button 
                  onClick={onDelete} 
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300 rounded-lg transition-all duration-200 ease-in-out"
                  title="Delete Project"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Toolbar */}
      <div className={`${compact ? 'px-0 py-0' : 'px-6 py-5'}`}>
        <div className={`flex items-center ${compact ? 'space-x-1' : 'space-x-3'} overflow-x-auto scrollbar-hide`}>
          {toolbarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const baseBtn = compact
              ? 'px-3 py-2 rounded-lg text-xs'
              : 'px-5 py-3 rounded-xl text-sm';

            return (
              <button
                key={item.id}
                onClick={() => handleViewChange(item.id)}
                className={`
                  group relative flex items-center ${compact ? 'space-x-1.5' : 'space-x-3'} ${baseBtn} font-semibold transition-all duration-300 ease-out
                  ${isActive 
                    ? `${item.bgColor} ${item.activeColor} ring-2 ring-offset-2 ring-offset-white shadow-lg shadow-slate-200/50 transform scale-105` 
                    : `text-slate-600 hover:text-slate-800 hover:bg-slate-50 hover:shadow-md hover:shadow-slate-200/30 hover:-translate-y-0.5`}
                  whitespace-nowrap flex-shrink-0 border border-transparent
                  ${isActive ? `${item.borderColor}` : 'hover:border-slate-200'}
                `}
              >
                <Icon className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} transition-all duration-300 ${isActive ? item.activeColor : 'text-slate-500 group-hover:text-slate-600'}`} />
                {!compact && <span className="font-medium">{item.label}</span>}
                {item.count !== undefined && (
                  <span className={`
                    inline-flex items-center justify-center min-w-[20px] h-5 px-2 text-xs font-bold rounded-full transition-all duration-300
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
      {showQuickActions && !compact && (
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50/50 to-slate-100/50 border-t border-slate-200 rounded-b-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick Actions</span>
              <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
            </div>
            <div className="flex items-center space-x-1">
              {quickActions.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <button 
                    key={action.label}
                    onClick={() => handleViewChange(action.view)} 
                    className={`
                      group inline-flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-lg
                      transition-all duration-200 ease-in-out transform hover:-translate-y-0.5
                      ${action.color} hover:bg-white hover:shadow-md hover:shadow-slate-200/50
                      border border-transparent hover:border-slate-200
                    `}
                  >
                    <ActionIcon className="h-3 w-3 transition-transform group-hover:scale-110" />
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