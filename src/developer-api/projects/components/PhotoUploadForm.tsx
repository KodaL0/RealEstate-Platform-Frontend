import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import developersApi from '../../../config/developers-api';

interface PhotoUploadFormProps {
  projectId: number;
  onClose: () => void;
  onUpload: (photo: any) => void;
}

export default function PhotoUploadForm({ projectId, onClose, onUpload }: PhotoUploadFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{ file: File; preview: string }>>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newPhotos = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setUploadedPhotos(prev => [...prev, ...newPhotos]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 20,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removePhoto = (index: number) => {
    const photo = uploadedPhotos[index];
    URL.revokeObjectURL(photo.preview);
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedPhotos.length === 0) return;

    setIsUploading(true);

    try {
      const uploadPromises = uploadedPhotos.map(async (photoData) => {
        try {
          const response = await developersApi.projectAssets.create({
            file: photoData.file,
            project: projectId,
            category: 'photos',
            title: title || photoData.file.name.split('.')[0],
            description: description,
          });
          return response.data;
        } catch (error) {
          throw new Error(`Failed to upload ${photoData.file.name}`);
        }
      });

      const uploadedPhotos = await Promise.all(uploadPromises);
      
      // Call onUpload for each successfully uploaded photo
      uploadedPhotos.forEach(photo => onUpload(photo));
      
      onClose();
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Some photos failed to upload. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    // Clean up object URLs
    uploadedPhotos.forEach(photo => URL.revokeObjectURL(photo.preview));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h3 className="text-base md:text-lg font-semibold">Upload Project Photos</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Photo Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos *
            </label>
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300 ${
                isDragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
                  isDragActive 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  📸
                </div>
                <h4 className="text-lg font-semibold text-gray-700 mb-4">
                  {isDragActive ? 'Drop photos here!' : 'Upload Project Photos'}
                </h4>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>• JPG, PNG, WebP supported</span>
                  <span>• Max 10MB per photo</span>
                  <span>• Up to 20 photos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Uploaded Photos Preview */}
          {uploadedPhotos.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Photos ({uploadedPhotos.length})
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {uploadedPhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={photo.preview} 
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Remove Button */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-all duration-200"
                          title="Remove photo"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    
                    {/* File Info */}
                    <div className="mt-1 text-center">
                      <p className="text-xs text-gray-600 truncate">
                        {photo.file.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="Enter title for all photos (or leave blank to use filenames)"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 resize-vertical"
              rows={3}
              placeholder="Optional description for all photos"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isUploading || uploadedPhotos.length === 0}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : `Upload ${uploadedPhotos.length} Photo${uploadedPhotos.length !== 1 ? 's' : ''}`}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
