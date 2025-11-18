# API Verification: Frontend vs Backend

## Backend API Structure (Django)

### URL Base
- **Backend URL:** `/api/dev/v1/` (from `Propertprodjango/config/urls.py:171`)
- **Frontend Base:** `/dev/v1` (prepended with `/api` by `baseURL` in `developers-api.ts:208`)
- **Full Path:** `/api/dev/v1/` ✅ **MATCHES**

### Endpoints

#### 1. Projects Endpoint
- **Backend:** `ProjectViewSet` → `/api/dev/v1/projects/`
- **Frontend:** `formatDevEndpoint('projects')` → `/api/dev/v1/projects/` ✅
- **Serializer:** `ProjectSerializer` includes `assets = ProjectAssetSerializer(many=True, read_only=True)`
- **Response Structure:**
  ```json
  {
    "id": 1,
    "name": "Project Name",
    "assets": [  // ← ProjectAsset objects (PHOTOS)
      {
        "id": 1,
        "project": 1,
        "file": "/media/developers/project_assets/file.jpg",  // ← URL string
        "category": "photos",
        "title": "...",
        "uploaded_at": "..."
      }
    ]
  }
  ```

#### 2. Project Assets Endpoint (Photos)
- **Backend:** `ProjectAssetViewSet` → `/api/dev/v1/project-assets/`
- **Frontend:** `formatDevEndpoint('project-assets')` → `/api/dev/v1/project-assets/` ✅
- **Model:** `ProjectAsset` with `category='photos'` for photos
- **Serializer:** `ProjectAssetSerializer` with `fields = '__all__'`
- **File Field:** `file` (FileField) → serializes as URL string ✅

#### 3. Developer Assets Endpoint (Documents)
- **Backend:** `DeveloperAssetViewSet` → `/api/dev/v1/assets/`
- **Frontend:** `formatDevEndpoint('assets')` → `/api/dev/v1/assets/` ✅
- **Model:** `DeveloperAsset` with `asset_type='document'` for documents
- **Serializer:** `DeveloperAssetSerializer` includes `file_url` method field
- **File Field:** `file` + `file_url` (computed) ✅

## Model Relationships

### Project Model
```python
# Project has TWO relationships:
- assets (related_name='assets') → ProjectAsset (PHOTOS)
- developer_assets (related_name='developer_assets') → DeveloperAsset (DOCUMENTS)
```

### ProjectAsset (Photos)
- **Model:** `ProjectAsset` (line 150-172 in models.py)
- **Relationship:** `project.assets` (related_name='assets')
- **Category Field:** `category` with choices including `'photos'`
- **File Field:** `file` (FileField) - serializes as URL string
- **No file_url method** - just uses `file` field directly

### DeveloperAsset (Documents)
- **Model:** `DeveloperAsset` (line 254+ in models.py)
- **Relationship:** `project.developer_assets` (related_name='developer_assets')
- **Type Field:** `asset_type` with choices including `'document'`
- **File Field:** `file` + `file_url` (SerializerMethodField)
- **Has file_url method** - builds absolute URI

## Frontend Code Verification

### ✅ CORRECT: Project Interface
```typescript
export interface Project {
  // ...
  assets?: ProjectAsset[]; // Photos from project.assets
  developer_assets?: DeveloperAsset[]; // Documents (not used, but correct)
}
```

### ✅ CORRECT: ProjectAsset Interface
```typescript
export interface ProjectAsset {
  id: number;
  project: number;
  file: string; // URL string from DRF FileField serialization
  category: 'photos' | ...;
  // ...
}
```

### ✅ CORRECT: DeveloperPortalApi
```typescript
// Gets photos from project.assets (ProjectAsset)
const projectPhotos = (project.assets || []).filter(asset => asset.category === 'photos');
firstPhotoUrl: sortedPhotos[0]?.file || project.main_image
```

### ✅ CORRECT: ProjectCard
```typescript
// Uses project.assets for photos
if (photos[0]?.file) return photos[0].file; // ProjectAsset uses 'file' field
```

### ✅ CORRECT: PhotoUploadForm
```typescript
// Uses projectAssets API with category='photos'
await developersApi.projectAssets.create({
  category: 'photos', // ✅ Valid ProjectAsset category
  // ...
});
```

## Potential Issues to Check

1. **File URL Format:**
   - ProjectAsset `file` field may be relative URL (`/media/...`)
   - Need to ensure baseURL is correct for media files
   - Check if `request.build_absolute_uri()` is needed

2. **Project.assets Inclusion:**
   - Verify that `ProjectSerializer` actually includes assets in list view
   - May need to check if `prefetch_related` is used in queryset

3. **Caching:**
   - `projects.listCached()` may not include assets if not prefetched
   - Need to verify assets are included in list response

