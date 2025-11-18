# Photo Retrieval Flow Documentation

## Where Photos Are Retrieved From

### 1. Initial Load (ProjectsPage)
**File:** `propertprofrontend/src/developer-api/ProjectsPage.tsx`
- Calls `developerPortalApi.initialize()` which loads all data

### 2. Centralized API Service
**File:** `propertprofrontend/src/developer-api/services/DeveloperPortalApi.ts`

**Line 92:** Fetches ALL assets using:
```typescript
developersApi.assets.listCached()
```
- **API Endpoint:** `/api/dev/v1/assets/`
- **Backend:** `DeveloperAssetViewSet.list()` in `Propertprodjango/developers/views.py`
- Returns all `DeveloperAsset` objects for projects the user has access to

**Line 102:** Filters assets by project (client-side):
```typescript
const projectAssets = assets.filter(a => a.project === project.id);
```

**Line 105:** Filters for image assets:
```typescript
const projectImages = projectAssets.filter(a => a.asset_type === 'image');
```

**Line 108-112:** Sorts images:
- Featured images first
- Then by upload date (newest first)

**Line 118:** Gets first photo URL:
```typescript
firstPhotoUrl: sortedImages[0]?.file_url || sortedImages[0]?.file || project.main_image
```

### 3. Backend Serializer
**File:** `Propertprodjango/developers/serializers.py`

**Line 72-79:** `get_file_url()` method:
```python
def get_file_url(self, obj):
    """Get the file URL"""
    if obj.file:
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url
    return None
```

- Uses Django's `obj.file.url` which generates the full URL
- If request context exists, builds absolute URI
- Returns `None` if no file

### 4. ProjectCard Component
**File:** `propertprofrontend/src/developer-api/projects/components/ProjectCard.tsx`

**Line 45-51:** `getImageSource()` function determines image priority:
1. `project.main_image` (URLField from Project model)
2. `preloadedStats?.firstPhotoUrl` (from centralized API)
3. `photos[0]?.file_url` (from DeveloperAsset)
4. `photos[0]?.file` (fallback)

**Line 118:** Image rendering:
```typescript
{imageSource && !imageError && (preloadedStats?.firstPhotoUrl || project.main_image || hasBeenVisible) ? (
  <img src={imageSource} ... />
) : null}
```

## Data Flow Summary

```
Backend Database (DeveloperAsset)
  ↓
Django Serializer (get_file_url)
  ↓
API Response: { file_url: "https://...", file: "/media/...", ... }
  ↓
Frontend: developersApi.assets.listCached()
  ↓
DeveloperPortalApi: Filter by project → Filter images → Sort → Get first
  ↓
ProjectCard: Use preloadedStats.firstPhotoUrl
  ↓
<img src={imageSource} />
```

## Potential Issues

1. **file_url might be None** if serializer doesn't have request context
2. **file field** might be relative path, not absolute URL
3. **Assets might not be loading** if API call fails silently
4. **Caching** might return stale data

## Debugging Steps

1. Check browser console for API responses
2. Verify `file_url` field in API response
3. Check if `assets.listCached()` returns data
4. Verify project filtering is working
5. Check if images are actually in the database

