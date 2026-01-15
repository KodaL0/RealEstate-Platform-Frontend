import { File, FileText, FileType2, Image, Sheet } from "lucide-react";
import type React from "react";

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

// Document type labels
const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  floor_plan: "Floor Plan",
  energy_certificate: "Energy Certificate",
  title_deed: "Title Deed",
  building_permit: "Building Permit",
  contract: "Contract",
  inspection_report: "Inspection Report",
  other: "Other",
};

// Helper: Get file icon
const getFileTypeIcon = (extension?: string): JSX.Element => {
  if (!extension) return <File className="w-full h-full" />;

  const ext = extension.toLowerCase();
  if (ext === ".pdf") return <FileText className="w-full h-full" />;
  if (ext === ".doc" || ext === ".docx") return <FileType2 className="w-full h-full" />;
  if (ext === ".xls" || ext === ".xlsx") return <Sheet className="w-full h-full" />;
  if (ext === ".jpg" || ext === ".jpeg" || ext === ".png" || ext === ".gif")
    return <Image className="w-full h-full" />;

  return <File className="w-full h-full" />;
};

// Helper: Get file color
const getFileColor = (extension?: string): string => {
  if (!extension) return "text-gray-600";

  const ext = extension.toLowerCase();
  if (ext === ".pdf") return "text-red-600";
  if (ext === ".doc" || ext === ".docx") return "text-blue-600";
  if (ext === ".xls" || ext === ".xlsx") return "text-green-600";
  if (ext === ".jpg" || ext === ".jpeg" || ext === ".png" || ext === ".gif")
    return "text-purple-600";

  return "text-gray-600";
};

// Reusable Document Card Component
const DocumentCard: React.FC<{ doc: PropertyDocument; onClick: () => void }> = ({
  doc,
  onClick,
}) => {
  const fileColor = getFileColor(doc.file_extension);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center justify-center text-center transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl p-4 border border-gray-200 hover:border-gray-300 hover:shadow-md"
    >
      <div
        className={`w-14 h-14 mb-3 ${fileColor} transition-all duration-200 group-hover:scale-110`}
      >
        {getFileTypeIcon(doc.file_extension)}
      </div>

      <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 line-clamp-2 leading-tight min-h-[2.5rem]">
        {doc.title}
      </p>

      {doc.file_extension && (
        <span className={`mt-2 text-xs uppercase font-bold ${fileColor}`}>
          {doc.file_extension.replace(".", "")}
        </span>
      )}
    </button>
  );
};

const PropertyDocuments: React.FC<PropertyDocumentsProps> = ({ documents }) => {
  if (!documents || documents.length === 0) return null;

  const handleDownload = (doc: PropertyDocument) => {
    window.open(doc.document, "_blank");
  };

  // Group documents by type
  const groupedDocs: Record<string, PropertyDocument[]> = {};
  documents.forEach((doc) => {
    const type = doc.document_type || "other";
    if (!groupedDocs[type]) groupedDocs[type] = [];
    groupedDocs[type].push(doc);
  });

  // Separate categorized docs from "other" docs
  const otherDocs = groupedDocs.other || [];
  const categorizedDocs = Object.entries(groupedDocs).filter(([type]) => type !== "other");

  return (
    <section className="bg-white rounded-3xl shadow-xl mb-10 overflow-hidden border border-slate-200">
      <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-6 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          Documents
        </h2>
      </div>

      <div className="p-8">
        {/* Categorized Documents */}
        {categorizedDocs.map(([type, docs]) => (
          <div key={type} className="mb-6 last:mb-0">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 pb-2 border-b border-gray-200">
              {DOCUMENT_TYPE_LABELS[type] || type}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {docs.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} onClick={() => handleDownload(doc)} />
              ))}
            </div>
          </div>
        ))}

        {/* "Other" Documents (no category label) */}
        {otherDocs.length > 0 && (
          <div className={categorizedDocs.length > 0 ? "mt-6" : ""}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {otherDocs.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} onClick={() => handleDownload(doc)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PropertyDocuments;
