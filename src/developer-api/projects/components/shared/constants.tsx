import { FileText, Image, Video, Music, Archive, Paperclip } from 'lucide-react';

export type AssetTypeValue = 'document' | 'image' | 'video' | 'audio' | 'archive' | 'other';

export interface AssetTypeOption {
  value: AssetTypeValue;
  label: string;
  // Icon is a React component from lucide-react
  icon: any;
  color: string; // Tailwind color utility for icon accenting
}

export const ASSET_TYPES: AssetTypeOption[] = [
  { value: 'document', label: 'Documents', icon: FileText, color: 'text-blue-600' },
  { value: 'image', label: 'Images', icon: Image, color: 'text-green-600' },
  { value: 'video', label: 'Videos', icon: Video, color: 'text-red-600' },
  { value: 'audio', label: 'Audio', icon: Music, color: 'text-purple-600' },
  { value: 'archive', label: 'Archives', icon: Archive, color: 'text-orange-600' },
  { value: 'other', label: 'Other', icon: Paperclip, color: 'text-gray-600' }
];

export const ALL_TYPE_OPTION = { value: '' as unknown as AssetTypeValue, label: 'All Types' };


