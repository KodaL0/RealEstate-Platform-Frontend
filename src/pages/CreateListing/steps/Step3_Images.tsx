import React from 'react';
import { Upload, Image, Star, X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { useListingWizard } from '../../../context/ListingWizardContext';
import { ListingForm } from '../../../types';

interface Props {
  formData: ListingForm;
  previewImages: string[];
  primaryIndex: number;
  setPrimaryIndex: React.Dispatch<React.SetStateAction<number>>;
  getRootProps: any;
  getInputProps: any;
  isDragActive: boolean;
  removeImage: (idx: number) => void;
}

const Step3_Images: React.FC<Props> = ({
  formData,
  previewImages,
  primaryIndex,
  setPrimaryIndex,
  getRootProps,
  getInputProps,
  isDragActive,
  removeImage
}) => {
  const { next, back } = useListingWizard();
  const valid = previewImages.length > 0 || formData.images.length > 0;

  return (
    <section className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-xl border border-gray-100 max-w-6xl mx-auto pb-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mb-4">
          <Camera className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Property Images</h2>
        <p className="text-gray-600 text-lg">Upload high-quality images to showcase your property</p>
      </div>

      {/* Upload Area */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <Upload className="w-5 h-5 mr-2 text-blue-600" />
          Upload Images <span className="text-red-500 ml-1">*</span>
        </h3>
        
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragActive 
              ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 scale-105' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
              isDragActive 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              <Upload className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-semibold text-gray-700 mb-2">
              {isDragActive ? 'Drop images here!' : 'Upload Property Images'}
            </h4>
            <p className="text-gray-500 mb-4">
              Drag & drop images here, or click to select files
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>• JPG, PNG, WebP supported</span>
              <span>• Max 10MB per image</span>
              <span>• Up to 20 images</span>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      {previewImages.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
              <Image className="w-5 h-5 mr-2 text-blue-600" />
              Uploaded Images ({previewImages.length})
            </h3>
            <div className="text-sm text-gray-500 flex items-center">
              <Star className="w-4 h-4 mr-1 text-yellow-500" />
              Click "Primary" to set main image
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {previewImages.map((preview, index) => (
              <div key={preview} className="relative group">
                <div className={`relative overflow-hidden rounded-xl transition-all duration-300 ${
                  index === primaryIndex 
                    ? 'ring-4 ring-blue-500 ring-offset-2 shadow-lg' 
                    : 'hover:shadow-lg hover:scale-105'
                }`}>
                  <img 
                    src={preview} 
                    alt={`Preview ${index + 1}`} 
                    className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-110" 
                  />
                  
                  {/* Primary Badge */}
                  {index === primaryIndex && (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Primary
                    </div>
                  )}
                  
                  {/* Overlay Controls */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
                      {index !== primaryIndex && (
                        <button 
                          type="button" 
                          onClick={() => setPrimaryIndex(index)} 
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors duration-200 flex items-center"
                        >
                          <Star className="w-3 h-3 mr-1" />
                          Set Primary
                        </button>
                      )}
                      <button 
                        type="button" 
                        onClick={() => removeImage(index)} 
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Image Info */}
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-500">Image {index + 1}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {previewImages.length === 0 && (
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 mb-8">
          <div className="text-center text-gray-500">
            <Image className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No images uploaded yet</h3>
            <p className="text-sm">Upload at least one image to continue</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-200">
        <button 
          type="button" 
          onClick={back} 
          className="group inline-flex items-center px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
        >
          <ChevronLeft className="w-5 h-5 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
          Back
        </button>
        
        <button
          type="button"
          disabled={!valid}
          onClick={next}
          className={`group relative px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 transform ${
            valid
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          <span className="flex items-center">
            Continue
            <ChevronRight className={`w-5 h-5 ml-2 transition-transform duration-200 ${
              valid ? 'group-hover:translate-x-1' : ''
            }`} />
          </span>
          
          {valid && (
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          )}
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-center text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
          <span className="ml-3">Step 3 of 4</span>
        </div>
      </div>
    </section>
  );
};

export default Step3_Images;