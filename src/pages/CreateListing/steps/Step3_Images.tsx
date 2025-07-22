import React from 'react';
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
    <section className="bg-gray-50 p-6 rounded-xl">
      <h2 className="text-2xl font-semibold mb-6">Images *</h2>

      <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}>
        <input {...getInputProps()} />
        <p className="mt-2 text-sm text-gray-600">Drag & drop images here, or click to select files</p>
      </div>

      {previewImages.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {previewImages.map((preview, index) => (
            <div key={preview} className="relative group">
              <img src={preview} alt={"Preview " + (index + 1)} className={`h-24 w-full object-cover rounded-lg ${index === primaryIndex ? 'border-4 border-blue-500' : ''}`} />
              <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100">×</button>
              <button type="button" onClick={() => setPrimaryIndex(index)} className="absolute bottom-1 left-1 bg-blue-500 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 text-xs">Primary</button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button type="button" onClick={back} className="px-4 py-2 border rounded">Back</button>
        <button type="button" disabled={!valid} onClick={next} className={`px-4 py-2 rounded text-white ${valid ? 'bg-blue-600' : 'bg-blue-300 cursor-not-allowed'}`}>Next</button>
      </div>
    </section>
  );
};
export default Step3_Images;