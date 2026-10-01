# PropertPro: Real Estate Marketplace Frontend

A responsive React frontend for browsing, listing, and managing properties across Cyprus and Greece.

## Highlights

- Buy and rent property search with location and amenity filters.
- Property, developer, project, and unit detail flows.
- Favorites, user messaging, profiles, and authentication flows.
- Developer-facing project and unit management tools.
- Mortgage calculator, legal-consent flows, SEO metadata, sitemaps, and Vercel routing.

## Tech stack

- React and TypeScript
- Vite and React Router
- Tailwind CSS, Bootstrap, and Framer Motion
- Leaflet and React Leaflet
- Axios, Zod, Biome, ESLint, and Vercel

## Local development

Install the locked dependency set:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

Useful commands:

```bash
npm run build
npm run preview
npm run lint
npm run lint:eslint
npm run format:check
npm run check
```

## Configuration

Copy the example configuration and add your own browser-safe values:

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Optional API host override |
| `VITE_USE_PROXY` | Whether to use the local API proxy |
| `VITE_GEOAPIFY_KEY` | Browser key for location autocomplete |

Values prefixed with `VITE_` are included in the browser build. Never put server credentials, database passwords, admin tokens, or private API keys in them.

In development, the frontend defaults to a local backend at `http://localhost:8000` and proxies `/api`, `/oauth`, and `/accounts`.

## Project structure

- `src/main.tsx`: application entry point.
- `src/App.tsx`: application routes.
- `src/config/`: environment and API client configuration.
- `src/developer-api/`: developer-facing API tooling.
- `public/`: static public assets.

## Quality notes

Biome and ESLint scripts are included. A canonical search URL test file exists, but the current package manifest does not include Vitest or an `npm test` script.
