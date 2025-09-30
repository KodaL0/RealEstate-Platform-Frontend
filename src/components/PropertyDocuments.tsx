import React from 'react';
import { FileText, File, Image, Sheet, FileType2 } from 'lucide-react';

interface PropertyDocument {
  id: number;
  document: string;
  document_type: string;
  title: string;
  description?: string;
  file_size?: number;
  file_extension?: string;
  formatted_file_size?: string;
  uploaded_at: string;
}

interface PropertyDocumentsProps {
  documents: PropertyDocument[];
}

// File type icon component
const getFileTypeIcon = (extension?: string): JSX.Element => {
  if (!extension) {
    return <File className="w-full h-full" />;
  }
  
  const ext = extension.toLowerCase();
  
  // PDF Icon
  if (ext === '.pdf') {
    return <FileText className="w-full h-full" />;
  }
  
  // Word Icon
  if (ext === '.doc' || ext === '.docx') {
    return <FileType2 className="w-full h-full" />;
  }
  
  // Excel Icon
  if (ext === '.xls' || ext === '.xlsx') {
    return <Sheet className="w-full h-full" />;
  }
  
  // Image Icon
  if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.gif') {
    return <Image className="w-full h-full" />;
  }
  
  // Default file icon
  return <File className="w-full h-full" />;
};

// Get color based on file extension
const getFileColor = (extension?: string): string => {
  if (!extension) return 'text-gray-600';
  
  const ext = extension.toLowerCase();
  
  if (ext === '.pdf') return 'text-red-600';
  if (ext === '.doc' || ext === '.docx') return 'text-blue-600';
  if (ext === '.xls' || ext === '.xlsx') return 'text-green-600';
  if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.gif') return 'text-purple-600';
  
  return 'text-gray-600';
};

const PropertyDocuments: React.FC<PropertyDocumentsProps> = ({ documents }) => {
  // Don't render if no documents
  if (!documents || documents.length === 0) {
    return null;
  }

  const handleDownload = (doc: PropertyDocument) => {
    // Open document in new tab for download
    window.open(doc.document, '_blank');
  };

  return (
    <section className="bg-white rounded-xl shadow-sm mb-8 overflow-hidden">
      <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <FileText className="w-6 h-6 mr-2 text-gray-600" />
          Available Documents
        </h2>
      </div>
      <div className="p-6">
        {/* Documents Grid - Icon and Title Only */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {documents.map((doc) => {
            const fileColor = getFileColor(doc.file_extension);
            
            return (
              <button
                key={doc.id}
                onClick={() => handleDownload(doc)}
                className="group flex flex-col items-center justify-center text-center transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl p-4 border border-gray-200 hover:border-gray-300 hover:shadow-md"
              >
                {/* File Icon */}
                <div className={`w-14 h-14 mb-3 ${fileColor} transition-all duration-200 group-hover:scale-110`}>
                  {getFileTypeIcon(doc.file_extension)}
                </div>
                
                {/* Document Title */}
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 line-clamp-2 leading-tight min-h-[2.5rem]">
                  {doc.title}
                </p>
                
                {/* File Type Badge */}
                {doc.file_extension && (
                  <span className={`mt-2 text-xs uppercase font-bold ${fileColor}`}>
                    {doc.file_extension.replace('.', '')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PropertyDocuments;
