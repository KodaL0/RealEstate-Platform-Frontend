import { useState } from 'react';
import { 
  Building2, 
  Image, 
  FileText, 
  Users, 
  BarChart3,
  Edit3,
  Trash2
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
  compact?: boolean; // new: compact variant for cards
  showHeader?: boolean; // new: toggle project info header
  showQuickActions?: boolean; // new: toggle quick action row
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
    { id: 'overview', label: 'Overview', icon: BarChart3, color: 'text-blue-600', bgColor: 'bg-blue-50', hoverBg: 'hover:bg-blue-100' },
    { id: 'units', label: 'Units', icon: Building2, color: 'text-green-600', bgColor: 'bg-green-50', hoverBg: 'hover:bg-green-100', count: stats.units },
    { id: 'assets', label: 'Assets', icon: FileText, color: 'text-purple-600', bgColor: 'bg-purple-50', hoverBg: 'hover:bg-purple-100', count: stats.assets },
    { id: 'photos', label: 'Photos', icon: Image, color: 'text-orange-600', bgColor: 'bg-orange-50', hoverBg: 'hover:bg-orange-100', count: stats.photos },
    { id: 'team', label: 'Team', icon: Users, color: 'text-indigo-600', bgColor: 'bg-indigo-50', hoverBg: 'hover:bg-indigo-100' }
  ];

  return (
    <div className={`${compact ? 'bg-transparent border-0 rounded-none' : 'bg-white border-t border-gray-200 rounded-b-lg'}`}>
      {/* Project Info Bar */}
      {showHeader && !compact && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h4 className="font-medium text-gray-900">{projectName}</h4>
              <span className="text-sm text-gray-500">ID: {projectId}</span>
            </div>
            <div className="flex items-center space-x-2">
              {onEdit && (
                <button onClick={onEdit} className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors" title="Edit Project">
                  <Edit3 className="h-4 w-4 mr-1.5" />
                  Edit
                </button>
              )}
              {onDelete && (
                <button onClick={onDelete} className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors" title="Delete Project">
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Toolbar */}
      <div className={`${compact ? 'px-0 py-0' : 'px-4 py-3'}`}>
        <div className={`flex items-center ${compact ? 'space-x-1' : 'space-x-2'} overflow-x-auto ${compact ? '' : 'pb-1'}`}>
          {toolbarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const baseBtn = compact
              ? 'px-3 py-1.5 rounded-md text-xs'
              : 'px-4 py-2.5 rounded-lg text-sm';

            return (
              <button
                key={item.id}
                onClick={() => handleViewChange(item.id)}
                className={`
                  flex items-center space-x-2 ${baseBtn} font-medium transition-all duration-200
                  ${isActive 
                    ? `${item.bgColor} ${item.color} ring-1 ring-offset-1 ring-offset-white ring-opacity-50 ${compact ? '' : 'shadow-sm'}` 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
                  ${!isActive ? item.hoverBg : ''}
                  whitespace-nowrap flex-shrink-0
                `}
              >
                <Icon className={`h-4 w-4 ${isActive ? item.color : 'text-gray-500'}`} />
                {!compact && <span>{item.label}</span>}
                {item.count !== undefined && (
                  <span className={`inline-flex items-center justify-center min-w-[18px] h-4 px-1 text-[10px] font-semibold rounded-full ${isActive ? 'bg-white bg-opacity-80' : 'bg-gray-200'}`}>
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
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Quick Actions:</span>
            <div className="flex items-center space-x-4">
              <button onClick={() => handleViewChange('units')} className="hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded transition-colors">+ Add Unit</button>
              <button onClick={() => handleViewChange('assets')} className="hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded transition-colors">+ Upload Asset</button>
              <button onClick={() => handleViewChange('photos')} className="hover:text-gray-700 hover:bg-gray-100 px-2 py-1 rounded transition-colors">+ Add Photo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
