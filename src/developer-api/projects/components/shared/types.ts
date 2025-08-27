export interface Asset {
  id: number;
  project: number;
  asset_type: string;
  file: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  title?: string;
  description?: string;
  document_category?: string;
  image_category?: string;
  video_category?: string;
  tags?: string[];
  is_public: boolean;
  is_featured: boolean;
  uploaded_at: string;
  width?: number;
  height?: number;
  page_count?: number;
}

export type ToggleHandler = (assetId: number) => void | Promise<void>;


