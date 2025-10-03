import React from 'react';
import { X, Home, FileText, Image, Phone, File } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSection: (sectionId: number) => void; // clarified name
  propertyTitle?: string;
}

const EditSectionModal: React.FC<EditSectionModalProps> = ({
  isOpen,
  onClose,
  onSelectSection,
  propertyTitle
}) => {
  const sections = [
    {
      id: 0,
      title: 'Property Type',
      description: 'Change property category and listing type',
      icon: Home,
      color: 'from-blue-500 to-blue-600',
      borderColor: 'border-blue-200',
      hoverColor: 'hover:border-blue-400',
      bgColor: 'bg-blue-50'
    },
    {
      id: 1,
      title: 'Property Details',
      description: 'Edit specifications, location, and description',
      icon: FileText,
      color: 'from-emerald-500 to-emerald-600',
      borderColor: 'border-emerald-200',
      hoverColor: 'hover:border-emerald-400',
      bgColor: 'bg-emerald-50'
    },
    {
      id: 2,
      title: 'Images',
      description: 'Upload, reorder, or remove property images',
      icon: Image,
      color: 'from-purple-500 to-purple-600',
      borderColor: 'border-purple-200',
      hoverColor: 'hover:border-purple-400',
      bgColor: 'bg-purple-50'
    },
    {
      id: 3,
      title: 'Documents',
      description: 'Upload property documents and certificates',
      icon: File,
      color: 'from-indigo-500 to-indigo-600',
      borderColor: 'border-indigo-200',
      hoverColor: 'hover:border-indigo-400',
      bgColor: 'bg-indigo-50'
    },
    {
      id: 4,
      title: 'Contact Information',
      description: 'Update contact details and preferences',
      icon: Phone,
      color: 'from-orange-500 to-orange-600',
      borderColor: 'border-orange-200',
      hoverColor: 'hover:border-orange-400',
      bgColor: 'bg-orange-50'
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 relative overflow-hidden">
              <div className="absolute inset-0 opacity-30"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Select Section to Edit
                  </h2>
                  {propertyTitle && (
                    <p className="text-blue-100 text-sm mt-1">
                      {propertyTitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <p className="text-gray-600 text-sm mb-6">
                Choose which section of your property listing you'd like to update:
              </p>

              <div className="grid gap-4">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <motion.button
                      key={section.id}
                      onClick={() => {
                        // 🔑 FIX: ensure correct id is passed
                        onSelectSection(section.id);
                        onClose(); // optional: close modal after selecting
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        group relative overflow-hidden
                        flex items-start p-5 rounded-xl
                        border-2 ${section.borderColor} ${section.hoverColor}
                        transition-all duration-300
                        hover:shadow-lg
                        text-left
                      `}
                    >
                      <div className={`
                        absolute inset-0 bg-gradient-to-r ${section.color}
                        opacity-0 group-hover:opacity-5 transition-opacity duration-300
                      `} />

                      <div className={`
                        relative flex-shrink-0 p-3 rounded-xl ${section.bgColor}
                        group-hover:scale-110 transition-transform duration-300
                      `}>
                        <Icon
                          className={`w-6 h-6 bg-gradient-to-r ${section.color} bg-clip-text text-transparent`}
                        />
                      </div>

                      <div className="ml-4 flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg group-hover:text-gray-800 transition-colors">
                          {section.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {section.description}
                        </p>
                      </div>

                      <div className="ml-2 self-center opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 flex items-start">
                  <svg
                    className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    You can navigate between sections while editing using the progress bar at the top of the page.
                  </span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditSectionModal;
