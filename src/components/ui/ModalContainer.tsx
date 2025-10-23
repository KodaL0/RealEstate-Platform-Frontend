import React from 'react';
import { X } from 'lucide-react';

interface ModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  overlayClassName?: string;
  contentClassName?: string;
}

const ModalContainer: React.FC<ModalContainerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = '',
  showCloseButton = true,
  overlayClassName = '',
  contentClassName = ''
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed left-0 right-0 bottom-0 z-[9998] bg-black/60 backdrop-blur-sm ${overlayClassName}`}
        style={{ top: 'var(--navbar-height, 0px)' }}
      />

      {/* Modal Container */}
      <div 
        className={`fixed left-0 right-0 bottom-0 z-[9999] flex items-center justify-center p-3 sm:p-4 pointer-events-none ${className}`}
        style={{ top: 'var(--navbar-height, 0px)' }}
      >
        <div className={`pointer-events-auto w-full max-w-2xl bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[95vh] overflow-y-auto ${contentClassName}`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-4 sm:px-8 sm:py-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-white/20 p-2 sm:p-3 rounded-lg sm:rounded-xl backdrop-blur">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg sm:text-2xl font-bold text-white">{title}</h2>
                {description && (
                  <p className="text-blue-100 text-xs sm:text-sm mt-0.5 sm:mt-1">{description}</p>
                )}
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors flex-shrink-0"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-4 sm:px-8 sm:py-6">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default ModalContainer;
