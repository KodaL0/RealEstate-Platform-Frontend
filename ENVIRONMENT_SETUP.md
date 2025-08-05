# Environment Configuration for Production

## API Configuration

The frontend automatically switches between development and production API endpoints:

### Development (localhost)
- **Base URL**: `http://127.0.0.1:8000`
- **Proxy**: Enabled (uses Vite dev server proxy)

### Production (Vercel)
- **Base URL**: `https://api.propertpro.com`
- **Proxy**: Disabled (direct API calls)

## Environment Variables (Optional Override)

You can override the default configuration using these environment variables:

```bash
# Override the default API base URL
VITE_API_BASE_URL=https://api.propertpro.com

# Override proxy usage
VITE_USE_PROXY=false
```

## Vercel Configuration

The `vercel.json` file routes API calls to the production backend:

```json
{
  "routes": [
    {
      "src": "^/api/(.*)$",
      "dest": "https://api.propertpro.com/api/$1"
    }
  ]
}
```

## How It Works

1. **Development**: Uses localhost with proxy for CORS-free development
2. **Production**: Uses `https://api.propertpro.com` for direct API calls
3. **Environment Variables**: Allow runtime configuration override
4. **Vercel Routes**: Handle API proxying at the deployment level

## Current Configuration

- ✅ Production URL set to `https://api.propertpro.com`
- ✅ Environment variable support added
- ✅ Vercel routing configured
- ✅ Automatic environment detection 