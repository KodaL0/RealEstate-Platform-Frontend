import React, { useState, useCallback } from 'react';
import { Upload, Image, Star, X, ChevronLeft, ChevronRight, Camera, GripVertical } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { useListingWizard } from '../../../context/ListingWizardContext';
import { ListingForm } from '../../../types';
import api from '../../../config/api';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  formData: ListingForm;
  setFormData: React.Dispatch<React.SetStateAction<ListingForm>>;
  previewImages: string[];
  setPreviewImages: React.Dispatch<React.SetStateAction<string[]>>;
  primaryIndex: number;
  setPrimaryIndex: React.Dispatch<React.SetStateAction<number>>;
  existingImageIds: string[];
  setExistingImageIds: React.Dispatch<React.SetStateAction<string[]>>;
  isEditing: boolean;
  propertyId?: string;
  username: string;
}

// Sortable Image Card Component
interface SortableImageProps {
  id: string;
  preview: string;
  index: number;
  isPrimary: boolean;
  onSetPrimary: () => void;
  onRemove: () => void;
}

const SortableImage: React.FC<SortableImageProps> = ({
  id,
  preview,
  index,
  isPrimary,
  onSetPrimary,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag Handle - Works for both touch and mouse */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -top-2 -left-2 z-20 bg-gray-700 hover:bg-gray-800 text-white p-1.5 rounded-full shadow-lg cursor-grab active:cursor-grabbing touch-none"
        style={{ touchAction: 'none' }}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div
        className={`relative overflow-hidden rounded-xl transition-all duration-200 ${
          isPrimary
            ? 'ring-4 ring-blue-500 ring-offset-2 shadow-lg'
            : 'hover:shadow-lg'
        }`}
      >
        <img
          src={preview}
          alt={`Preview ${index + 1}`}
          className="h-32 w-full object-cover"
        />

        {/* Primary Badge */}
        {isPrimary && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
            <Star className="w-3 h-3 mr-1 fill-current" />
            Primary
          </div>
        )}

        {/* Overlay Controls */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
            {!isPrimary && (
              <button
                type="button"
                onClick={onSetPrimary}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors duration-200 flex items-center"
              >
                <Star className="w-3 h-3 mr-1" />
                Set Primary
              </button>
            )}
            <button
              type="button"
              onClick={onRemove}
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
  );
};

const Step3_Images: React.FC<Props> = ({
  formData,
  setFormData,
  previewImages,
  setPreviewImages,
  primaryIndex,
  setPrimaryIndex,
  existingImageIds,
  setExistingImageIds,
  isEditing,
  propertyId,
  username,
}) => {
  const { next, back } = useListingWizard();
  const valid = previewImages.length > 0;
  const [activeId, setActiveId] = useState<string | null>(null);

  // Image upload handler
  const onDrop = useCallback((files: File[]) => {
    setFormData((p: ListingForm) => ({ ...p, images: [...p.images, ...files] }));
    setPreviewImages((p: string[]) => [...p, ...files.map(f => URL.createObjectURL(f))]);
  }, [setFormData, setPreviewImages]);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 20,
    maxSize: 5 * 1024 * 1024,
  });

  // Remove image handler
  const removeImage = async (idx: number) => {
    console.log(`🗑️ removeImage called: idx=${idx}`);
    
    // If editing and this is an existing image, delete via API
    if (isEditing && existingImageIds[idx]) {
      const imageId = existingImageIds[idx];
      
      if (imageId && !isNaN(Number(imageId))) {
        try {
          console.log(`📤 Deleting image via API: imageId=${imageId}`);
          await api.properties.deleteImage(username, Number(propertyId), Number(imageId));
          console.log(`✅ Image ${imageId} deleted successfully`);
          toast.success('Image deleted successfully');
        } catch (error: any) {
          console.error('❌ Failed to delete image:', error);
          const errorMsg = error?.response?.data?.detail || 'Failed to delete image';
          toast.error(errorMsg);
          return; // Don't update local state if API call failed
        }
      }
    }
    
    // Update local state
    setFormData((p: ListingForm) => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));
    if (idx < previewImages.length) URL.revokeObjectURL(previewImages[idx]);
    setPreviewImages((p: string[]) => p.filter((_, i) => i !== idx));
    setExistingImageIds((p: string[]) => p.filter((_, i) => i !== idx));
    setPrimaryIndex((i: number) => (idx === i ? 0 : idx < i ? i - 1 : i));
  };

  // Reorder images handler
  const reorderImages = async (fromIndex: number, toIndex: number) => {
    console.log(`🔄 reorderImages: ${fromIndex} → ${toIndex}`);
    if (fromIndex === toIndex) return;
    
    // Helper function to reorder an array
    const reorderArray = <T,>(arr: T[], from: number, to: number): T[] => {
      const result = [...arr];
      const [item] = result.splice(from, 1);
      result.splice(to, 0, item);
      return result;
    };
    
    // Helper to calculate new primary index after reordering
    const calculateNewPrimary = (currentPrimary: number, from: number, to: number): number => {
      if (currentPrimary === from) return to;
      if (from < to) {
        // Moving right: items between from+1 and to shift left
        if (currentPrimary > from && currentPrimary <= to) return currentPrimary - 1;
      } else {
        // Moving left: items between to and from-1 shift right
        if (currentPrimary >= to && currentPrimary < from) return currentPrimary + 1;
      }
      return currentPrimary;
    };
    
    // For new images (not yet saved) or mixed state, handle locally only
    if (!isEditing || formData.images.length > 0) {
      console.log('📦 Local reorder (new images)');
      setFormData(p => ({ ...p, images: reorderArray(p.images, fromIndex, toIndex) }));
      setPreviewImages(p => reorderArray(p, fromIndex, toIndex));
      setExistingImageIds(p => reorderArray(p, fromIndex, toIndex));
      setPrimaryIndex(curr => calculateNewPrimary(curr, fromIndex, toIndex));
      return;
    }
    
    // For existing images only (editing mode)
    const imageId = existingImageIds[fromIndex];
    
    if (!imageId || isNaN(Number(imageId))) {
      console.error('❌ Invalid image ID:', imageId);
      toast.error('Cannot reorder: invalid image ID');
      return;
    }
    
    console.log(`📋 Reordering existing image: ID=${imageId}`);
    
    // Store state for rollback
    const snapshot = {
      previews: [...previewImages],
      ids: [...existingImageIds],
      primary: primaryIndex,
    };
    
    // Optimistic update
    const newPreviews = reorderArray(previewImages, fromIndex, toIndex);
    const newIds = reorderArray(existingImageIds, fromIndex, toIndex);
    const newPrimary = calculateNewPrimary(primaryIndex, fromIndex, toIndex);
    
    setPreviewImages(newPreviews);
    setExistingImageIds(newIds);
    setPrimaryIndex(newPrimary);
    
    console.log(`📸 New order:`, newIds);
    console.log(`⭐ New primary index: ${newPrimary}`);
    
    // Sync with backend
    try {
      await api.properties.updateImageOrder(username, Number(propertyId), Number(imageId), {
        display_order: toIndex
      });
      console.log(`✅ Synced with backend`);
    } catch (error: any) {
      console.error('❌ Reorder failed:', error);
      
      // Rollback
      setPreviewImages(snapshot.previews);
      setExistingImageIds(snapshot.ids);
      setPrimaryIndex(snapshot.primary);
      
      const msg = error?.response?.data?.detail || 'Failed to reorder image';
      toast.error(msg);
    }
  };

  // Set primary image handler
  const handleSetPrimary = async (newIndex: number) => {
    const oldIndex = primaryIndex;
    
    if (newIndex === oldIndex) return;
    
    // If editing and we have existing images, update via API
    if (isEditing && existingImageIds.length > 0) {
      try {
        const imageId = existingImageIds[newIndex];
        if (imageId) {
          // Set new primary - backend will move it to position 0
          await api.properties.updateImageOrder(username, Number(propertyId), Number(imageId), {
            is_primary: true
          });
          
          // Reorder local state to reflect the change - move selected to front
          setPreviewImages((prev) => {
            const newPreviews = [...prev];
            const [removed] = newPreviews.splice(newIndex, 1);
            newPreviews.unshift(removed);  // Add to beginning
            return newPreviews;
          });
          
          setExistingImageIds((prev) => {
            const newIds = [...prev];
            const [removed] = newIds.splice(newIndex, 1);
            newIds.unshift(removed);
            return newIds;
          });
          
          // Primary is now at index 0
          setPrimaryIndex(0);
          
          console.log(`Set image ${imageId} as primary and moved to position 0`);
        }
      } catch (error) {
        console.error('Failed to update primary image:', error);
        // Don't revert - let user try again
      }
    } else {
      // For new images, just update local state
      setPrimaryIndex(newIndex);
    }
  };

  // Configure sensors for both pointer (mouse) and touch with optimized activation
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px of movement required before drag starts (was 8)
        tolerance: 5,
        delay: 0,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // IDs are indices, so we can use them directly
      const oldIndex = Number(active.id);
      const newIndex = Number(over.id);
      
      console.log(`Drag ended: ${oldIndex} → ${newIndex}`);
      reorderImages(oldIndex, newIndex);
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return (
    <section className="bg-gradient-to-br from-white to-gray-50 p-4 sm:p-8 rounded-2xl shadow-xl border border-gray-100 max-w-6xl mx-auto pb-8">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-2">
          <Camera className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Property Images</h2>
        <p className="text-gray-600 text-sm">Upload high-quality images to showcase your property</p>
      </div>

      {/* Upload Area */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100 mb-8">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center">
          <Upload className="w-5 h-5 mr-2 text-blue-600" />
          Upload Images <span className="text-red-500 ml-1">*</span>
        </h3>
        
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragActive 
              ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 scale-105' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} multiple />
          <div className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
              isDragActive 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              <Upload className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-semibold text-gray-700 mb-4">
              {isDragActive ? 'Drop images here!' : 'Upload Property Images'}
            </h4>
            <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-2 sm:space-y-0 text-sm text-gray-400">
              <span>• JPG, PNG, WebP</span>
              <span>• Max 10MB per image</span>
              <span>• Up to 20 images</span>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery with Drag & Drop */}
      {previewImages.length > 0 && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
              <Image className="w-5 h-5 mr-2 text-blue-600" />
              Uploaded Images ({previewImages.length})
            </h3>
            <div className="text-sm text-gray-500 flex items-center">
              <GripVertical className="w-4 h-4 mr-1 text-gray-400" />
              Drag handle to reorder
            </div>
          </div>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext items={previewImages.map((_, idx) => String(idx))} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {previewImages.map((preview, index) => (
                  <SortableImage
                    key={index}
                    id={String(index)}
                    preview={preview}
                    index={index}
                    isPrimary={index === primaryIndex}
                    onSetPrimary={() => handleSetPrimary(index)}
                    onRemove={() => removeImage(index)}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay dropAnimation={null}>
              {activeId !== null ? (
                <div className="relative opacity-95 scale-110 rotate-2 shadow-2xl transition-transform duration-150">
                  <div className="relative overflow-hidden rounded-xl ring-4 ring-blue-500 ring-offset-2">
                    <img
                      src={previewImages[Number(activeId)]}
                      alt="Dragging"
                      className="h-32 w-full object-cover"
                    />
                    {/* Visual feedback during drag */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 pointer-events-none" />
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
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
          className="group inline-flex items-center px-4 sm:px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
        >
          <ChevronLeft className="w-5 h-5 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
          Back
        </button>
        
        <button
          type="button"
          disabled={!valid}
          onClick={next}
          className={`group relative px-6 sm:px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 transform ${
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
    </section>
  );
};

export default Step3_Images;