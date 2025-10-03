import React, { useState } from 'react';
import { X, Home, FileText, Image, Phone, File } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyTitle?: string;
}

const EditSectionModal: React.FC<EditSectionModalProps> = ({
  isOpen,
  onClose,
  propertyTitle
}) => {
  const [activeSection, setActiveSection] = useState<number | null>(null);

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
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {activeSection === null
                      ? 'Select Section to Edit'
                      : sections.find(s => s.id === activeSection)?.title}
                  </h2>
                  {propertyTitle && (
                    <p className="text-blue-100 text-sm mt-1">{propertyTitle}</p>
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
              {activeSection === null ? (
                <>
                  <p className="text-gray-600 text-sm mb-6">
                    Choose which section of your property listing you'd like to update:
                  </p>

                  <div className="grid gap-4">
                    {sections.map((section) => {
                      const Icon = section.icon;
                      return (
                        <motion.button
                          key={section.id}
                          onClick={() => setActiveSection(section.id)}
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
                            <Icon className={`w-6 h-6 bg-gradient-to-r ${section.color} bg-clip-text text-transparent`} />
                          </div>
                          <div className="ml-4 flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg group-hover:text-gray-800 transition-colors">
                              {section.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {section.description}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div>
                  {/* Section-specific content */}
                  {activeSection === 0 && <p>📌 Property Type form goes here...</p>}
                  {activeSection === 1 && <p>📝 Property Details form goes here...</p>}
                  {activeSection === 2 && <p>🖼️ Images upload form goes here...</p>}
                  {activeSection === 3 && <p>📂 Documents upload form goes here...</p>}
                  {activeSection === 4 && <p>☎️ Contact Information form goes here...</p>}

                  <button
                    className="mt-6 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    onClick={() => setActiveSection(null)}
                  >
                    ← Back to Sections
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditSectionModal;
