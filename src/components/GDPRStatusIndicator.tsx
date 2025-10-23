import React from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';

interface GDPRStatusIndicatorProps {
  variant?: 'banner' | 'badge' | 'inline';
  showDetails?: boolean;
  className?: string;
}

const GDPRStatusIndicator: React.FC<GDPRStatusIndicatorProps> = ({
  variant = 'inline',
  showDetails = true,
  className = ''
}) => {
  const { user, getGDPRStatus } = useUser();
  const gdprStatus = getGDPRStatus();

  if (!user || !gdprStatus) {
    return null;
  }

  // Always hide the indicator unless explicitly re-enabled elsewhere
  return null;

  const { consents, processingRestricted } = gdprStatus;

  // Determine overall status
  const hasAnyConsent = consents.analytics || consents.marketing;
  const status = processingRestricted ? 'restricted' : hasAnyConsent ? 'compliant' : 'incomplete';

  // Status configurations
  const statusConfig = {
    restricted: {
      icon: AlertTriangle,
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
      label: 'Processing Restricted',
      description: 'Some features are limited due to processing restrictions.'
    },
    compliant: {
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
      label: 'GDPR Compliant',
      description: 'Your privacy preferences are set and data rights are protected.'
    },
    incomplete: {
      icon: Shield,
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
      label: 'Privacy Settings Available',
      description: 'Set your consent preferences for better personalization.'
    }
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  if (variant === 'banner') {
    return (
      <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
            <div>
              <h3 className={`font-medium ${config.textColor}`}>{config.label}</h3>
              {showDetails && (
                <p className={`text-sm ${config.textColor} opacity-90`}>
                  {config.description}
                </p>
              )}
            </div>
          </div>
          <Link
            to="/privacy-settings"
            className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Manage Privacy
          </Link>
        </div>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}>
        <IconComponent className={`h-3 w-3 mr-1 ${config.iconColor}`} />
        {config.label}
      </div>
    );
  }

  // Inline variant (default)
  return (
    <div className={`flex items-center space-x-2 text-sm ${config.textColor} ${className}`}>
      <IconComponent className={`h-4 w-4 ${config.iconColor}`} />
      <span className="font-medium">{config.label}</span>
      {showDetails && (
        <>
          <span className="text-gray-400">•</span>
          <Link
            to="/privacy-settings"
            className="text-blue-600 hover:text-blue-800 underline text-xs"
          >
            Settings
          </Link>
        </>
      )}
    </div>
  );
};

export default GDPRStatusIndicator;
