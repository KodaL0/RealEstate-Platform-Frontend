import React, { useState, useCallback, useEffect, memo } from 'react';
import { Upload, Image, Star, X, ChevronLeft, ChevronRight, Camera, GripVertical } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { useWizardNavigation } from '../../../context/ListingWizardContext';
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

// Stable image item with unique ID
interface ImageItem {
  id: string; // Stable unique ID
  preview: string; // Object URL or server URL
  file?: File; // Only present for new uploads
  existingImageId?: string; // Only present for server images
  isPrimary: boolean;
}

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
  const { next, back } = useWizardNavigation();
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Single source of truth: unified image items with stable IDs
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);

  // Initialize imageItems from parent state (on mount and when parent changes)
  useEffect(() => {
    const items: ImageItem[] = [];
    
    // Build a map of previews to files for new images
    // formData.images contains all new image files
    const previewToFileMap = new Map<string, File>();
    let fileIndex = 0;
    
    // Map each new image preview to its file
    for (let i = 0; i < previewImages.length; i++) {
      if (!existingImageIds[i] && fileIndex < formData.images.length) {
        previewToFileMap.set(previewImages[i], formData.images[fileIndex]);
        fileIndex++;
      }
    }
    
    // Build imageItems in the order they appear in previewImages
    for (let i = 0; i < previewImages.length; i++) {
      const preview = previewImages[i];
      const existingId = existingImageIds[i];
      
      if (existingId) {
        // This is an existing server image
        items.push({
          id: `existing-${existingId}`,
          preview: preview,
          existingImageId: existingId,
          isPrimary: i === primaryIndex,
        });
      } else {
        // This is a new local image - get its file from the map
        const file = previewToFileMap.get(preview);
        if (file) {
          items.push({
            id: `new-${preview}`, // Use preview URL as stable ID
            preview: preview,
            file: file,
            isPrimary: i === primaryIndex,
          });
        }
      }
    }
    
    setImageItems(items);
  }, [previewImages, existingImageIds, primaryIndex, formData.images]);

  // Cleanup: Revoke all object URLs on unmount
  useEffect(() => {
    return () => {
      imageItems.forEach(item => {
        if (item.file && item.preview.startsWith('blob:')) {
          URL.revokeObjectURL(item.preview);
        }
      });
    };
  }, [imageItems]);

  // Sync imageItems back to parent state
  const syncToParent = useCallback((items: ImageItem[]) => {
    const newPreviews: string[] = [];
    const newExistingIds: string[] = [];
    const newFiles: File[] = [];
    let newPrimaryIndex = 0;

    items.forEach((item, idx) => {
      newPreviews.push(item.preview);
      
      if (item.existingImageId) {
        newExistingIds.push(item.existingImageId);
      } else {
        newExistingIds.push('');
      }
      
      if (item.file) {
        newFiles.push(item.file);
      }
      
      if (item.isPrimary) {
        newPrimaryIndex = idx;
      }
    });

    setPreviewImages(newPreviews);
    setExistingImageIds(newExistingIds);
    setFormData(p => ({ ...p, images: newFiles }));
    setPrimaryIndex(newPrimaryIndex);
  }, [setPreviewImages, setExistingImageIds, setFormData, setPrimaryIndex]);

  const valid = imageItems.length > 0;

  // Image upload handler
  const onDrop = useCallback((files: File[]) => {
    const newItems: ImageItem[] = files.map((file) => {
      const preview = URL.createObjectURL(file);
      return {
        id: `new-${preview}`, // Use preview URL as stable ID
        preview: preview,
        file,
        isPrimary: false,
      };
    });
    
    const updatedItems = [...imageItems, ...newItems];
    setImageItems(updatedItems);
    syncToParent(updatedItems);
  }, [imageItems, syncToParent]);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 20,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Remove image handler
  const removeImage = async (itemId: string) => {
    const item = imageItems.find(i => i.id === itemId);
    if (!item) return;
    
    // Delete existing image via API
    if (isEditing && item.existingImageId) {
      try {
        await api.properties.deleteImage(username, Number(propertyId), Number(item.existingImageId));
        toast.success('Image deleted');
      } catch (error: any) {
        toast.error(error?.response?.data?.detail || 'Failed to delete image');
        return;
      }
    }
    
    // Revoke object URL if it's a blob
    if (item.file && item.preview.startsWith('blob:')) {
      URL.revokeObjectURL(item.preview);
    }
    
    // Remove from local state
    const updatedItems = imageItems.filter(i => i.id !== itemId);
    
    // Set first item as primary if we removed the primary
    if (item.isPrimary && updatedItems.length > 0) {
      updatedItems[0].isPrimary = true;
    }
    
    setImageItems(updatedItems);
    syncToParent(updatedItems);
  };

  // Persist image order using bulk reorder API
  const persistImageOrder = async (items: ImageItem[]) => {
    if (!propertyId) {
      throw new Error('Missing propertyId');
    }

    // Extract existing image IDs in their current order
    const existingImageIds = items
      .map(item => item.existingImageId ? Number(item.existingImageId) : null)
      .filter((id): id is number => id !== null);

    if (!existingImageIds.length) return; // Only new images, nothing to persist

    // Find primary image index
    const primaryIndex = items.findIndex(item => item.isPrimary && item.existingImageId);

    // Single API call to reorder all images and set primary
    await api.properties.reorderImages(
      username, 
      Number(propertyId), 
      existingImageIds, 
      primaryIndex >= 0 ? primaryIndex : 0
    );
  };

  // Reorder images handler
  const reorderImages = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    // Reorder array helper
    const reorder = <T,>(arr: T[], from: number, to: number): T[] => {
      const result = [...arr];
      const [item] = result.splice(from, 1);
      result.splice(to, 0, item);
      return result;
    };
    
    const snapshot = [...imageItems];
    const reordered = reorder(imageItems, fromIndex, toIndex);
    
    // Update local state optimistically
    setImageItems(reordered);
    syncToParent(reordered);
    
    // Persist to backend if editing
    if (isEditing && reordered.some(item => item.existingImageId)) {
      try {
        await persistImageOrder(reordered);
      } catch (error: any) {
        // Rollback on error
        setImageItems(snapshot);
        syncToParent(snapshot);
        toast.error(error?.response?.data?.detail || 'Failed to reorder images');
      }
    }
  };

  // Set primary image handler
  const handleSetPrimary = async (itemId: string) => {
    const targetItem = imageItems.find(i => i.id === itemId);
    if (!targetItem || targetItem.isPrimary) return;
    
    const snapshot = [...imageItems];
    
    // Mark target as primary, move to position 0
    const updatedItems = imageItems.map(item => ({
      ...item,
      isPrimary: item.id === itemId,
    }));
    
    const targetIndex = updatedItems.findIndex(i => i.id === itemId);
    if (targetIndex > 0) {
      const [removed] = updatedItems.splice(targetIndex, 1);
      updatedItems.unshift(removed);
    }
    
    // Update local state optimistically
    setImageItems(updatedItems);
    syncToParent(updatedItems);
    
    // Only persist to backend if:
    // 1. We're in edit mode
    // 2. The target image being set as primary is an EXISTING image (not a new upload)
    // New images will be set as primary on final form submission
    if (isEditing && targetItem.existingImageId) {
      try {
        await persistImageOrder(updatedItems);
        toast.success('Primary image updated');
      } catch (error) {
        // Rollback on error
        setImageItems(snapshot);
        syncToParent(snapshot);
        toast.error('Failed to set primary image');
      }
    } else if (isEditing && !targetItem.existingImageId) {
      // New image set as primary - will be saved on form submission
      toast.success('Primary image will be updated when you save');
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
      const oldIndex = imageItems.findIndex(i => i.id === active.id);
      const newIndex = imageItems.findIndex(i => i.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderImages(oldIndex, newIndex);
      }
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Handle navigation: persist order before moving to next step
  const handleNext = async () => {
    if (isEditing && imageItems.some(item => item.existingImageId)) {
      try {
        await persistImageOrder(imageItems);
      } catch (error: any) {
        toast.error(error?.response?.data?.detail || 'Could not save image order');
        return;
      }
    }
    next();
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
      {imageItems.length > 0 && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
              <Image className="w-5 h-5 mr-2 text-blue-600" />
              Uploaded Images ({imageItems.length})
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
            <SortableContext items={imageItems.map(item => item.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {imageItems.map((item, index) => (
                  <SortableImage
                    key={item.id}
                    id={item.id}
                    preview={item.preview}
                    index={index}
                    isPrimary={item.isPrimary}
                    onSetPrimary={() => handleSetPrimary(item.id)}
                    onRemove={() => removeImage(item.id)}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay dropAnimation={null}>
              {activeId !== null ? (
                (() => {
                  const draggedItem = imageItems.find(i => i.id === activeId);
                  return draggedItem ? (
                <div className="relative opacity-95 scale-110 rotate-2 shadow-2xl transition-transform duration-150">
                  <div className="relative overflow-hidden rounded-xl ring-4 ring-blue-500 ring-offset-2">
                    <img
                          src={draggedItem.preview}
                      alt="Dragging"
                      className="h-32 w-full object-cover"
                    />
                    {/* Visual feedback during drag */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 pointer-events-none" />
                  </div>
                </div>
                  ) : null;
                })()
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}
      
      {/* Empty State */}
      {imageItems.length === 0 && (
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
          onClick={handleNext}
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

export default memo(Step3_Images);