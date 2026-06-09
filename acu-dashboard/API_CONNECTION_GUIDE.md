# API Connection Guide

This document explains how the frontend connects to the backend API and how to configure it for different environments.

## Overview

The `acu-dashboard` frontend communicates with the HyperCapacity backend API to fetch dashboard data. The connection is configured using environment variables and Vite's proxy feature.

## Local Development Setup

### Prerequisites

1. **Backend running**: Ensure the backend is running on `http://127.0.0.1:8000`
   ```bash
   cd backend
   ./start_backend.sh
   ```

2. **Frontend environment**: The `.env.local` file is already configured for local development
   ```
   VITE_API_BASE_URL=http://127.0.0.1:8000
   ```

### Starting the Frontend

```bash
cd acu-dashboard
npm install
npm run dev
```

The frontend will start on `http://localhost:3000` (or the next available port).

## How It Works

### Development Mode (npm run dev)

When running in development mode:

1. **Vite Proxy**: The Vite development server intercepts requests to `/api/*` and forwards them to the backend
2. **Configuration**: The proxy target is configured in `vite.config.ts`:
   ```typescript
   proxy: {
     "/api": {
       target: process.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
       changeOrigin: true,
       rewrite: (path) => path,
     },
   }
   ```

3. **Request Flow**:
   - Browser requests: `http://localhost:3000/api/dashboard/overview`
   - Vite proxy forwards to: `http://127.0.0.1:8000/api/dashboard/overview`
   - Response is returned to the browser

### Production Mode (npm run build)

For production builds, you have two options:

#### Option 1: Using Environment Variable
Set `VITE_API_BASE_URL` at build time:
```bash
VITE_API_BASE_URL=https://api.yourdomain.com npm run build
```

The frontend will make direct requests to the specified URL.

#### Option 2: Using Relative Paths (Recommended)
If the frontend and backend are served from the same domain:
- Leave `VITE_API_BASE_URL` unset
- The frontend will use relative paths (`/api/dashboard/overview`)
- Your reverse proxy (nginx, etc.) should forward `/api/*` to the backend

## Configuration Files

### .env.local (Development)
```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

This file is used by Vite during development. It's already configured for local development.

### .env.example
Shows all available environment variables and their purposes.

## API Endpoints

The frontend communicates with these backend endpoints:

- **GET /api/dashboard/overview** - Main dashboard data
  - Used by: Dashboard.tsx
  - Returns: Dashboard overview with sections, cards, and charts

- **GET /api/instruments** - List of available instruments
  - Returns: Metadata for all tradeable indices

- **GET /api/indices/{symbol}/latest** - Current index value
  - Returns: Latest price and change metrics

- **GET /api/indices/{symbol}/sources** - Data sources for an index
  - Returns: Information about where the data comes from

- **GET /api/indices/{symbol}/methodology** - Index methodology
  - Returns: Detailed explanation of how the index is calculated

## Troubleshooting

### Frontend shows "Backend Connection Error"

**Symptoms**: Dashboard displays error message instead of data

**Solutions**:
1. Check if backend is running:
   ```bash
   curl http://127.0.0.1:8000/
   ```

2. Check browser console for detailed error messages (F12 → Console tab)

3. Verify the API URL in the error message matches your backend URL

4. Check CORS headers in backend response:
   ```bash
   curl -i http://127.0.0.1:8000/api/dashboard/overview
   ```

### Requests timeout or hang

**Symptoms**: Loading spinner never stops

**Solutions**:
1. Check backend logs for errors
2. Verify network connectivity to the backend
3. Check if backend is processing requests slowly
4. Look at browser Network tab (F12 → Network) to see request status

### 404 errors on API calls

**Symptoms**: Errors like "404 Not Found"

**Solutions**:
1. Verify the backend has the required routes mounted
2. Check the endpoint path in the error message
3. Ensure backend is running the latest code

## Environment-Specific Configuration

### Local Development
```bash
# .env.local
VITE_API_BASE_URL=http://127.0.0.1:8000
npm run dev
```

### Staging
```bash
VITE_API_BASE_URL=https://staging-api.yourdomain.com npm run build
npm run preview
```

### Production
```bash
# Option 1: With explicit URL
VITE_API_BASE_URL=https://api.yourdomain.com npm run build

# Option 2: With relative paths (recommended)
npm run build
# Deploy frontend and backend on same domain
```

## CORS Configuration

The backend has CORS middleware configured to accept requests from any origin during development:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Note**: For production, this should be restricted to your specific frontend domain.

## Related Files

- `vite.config.ts` - Vite configuration with proxy settings
- `client/src/pages/Dashboard.tsx` - Main dashboard component with API calls
- `.env.local` - Local development environment variables
- `.env.example` - Template for environment variables
