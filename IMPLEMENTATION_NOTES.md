# Pasty Bakery Frontend - Real Backend Integration

## Overview

The frontend is now fully connected to the real backend at `https://pastyback.jblasc.com/api` with WebSocket support at `wss://pastyback.jblasc.com/ws`.

## Key Changes Made

### 1. Authentication Removed ✓

- **File**: `/app/page.tsx`
- **Change**: Removed Supabase login flow. The app now redirects directly to `/dashboard`
- **Auth Provider**: Updated to auto-initialize with a default operator user (no authentication needed)
- **Sidebar**: Removed logout button since there's no login

### 2. API Client Enhanced ✓

- **File**: `/lib/api.ts`
- **Added Endpoints**:
  - `getOptimizationStatus(jobId)` - Check job status
  - `getQueueStatus()` - View optimization queue
  - `getLogs(jobId)` - Fetch LINGO solver logs
  - All product/ingredient/machine CRUD operations
  - Matrix-specific endpoints: `getProductIngredients`, `addProductIngredient`, etc.
  - Stock and resource management endpoints
- **Updated Types**: OptimizationResult now includes all possible job statuses

### 3. Spreadsheet Matrix Editors ✓

- **File**: `/components/config/matrix-editor.tsx` (new)
- **Features**:
  - Editable table for Q (ingredient consumption)
  - Editable table for T (machine time)
  - Editable table for CM (operational resources)
  - Real-time cell editing with validation
  - Auto-save on blur or manual save button
  - Responsive design with overflow handling

- **File**: `/app/config/page.tsx` (updated)
- **Changes**:
  - Fetches real products, ingredients, machines from API
  - CRUD operations now call real backend endpoints
  - Matrix editors displayed when products and ingredients exist
  - Loading states and error handling

### 4. WebSocket Real-Time Status ✓

- **File**: `/app/optimize/page.tsx` (updated)
- **Features**:
  - WebSocket connection management with auto-reconnect
  - Real-time job status updates (pending → processing → done/error/cancelled)
  - Visual indicators:
    - Pending: Amber clock icon with pulse
    - Processing: Blue lightning icon with progress bar
    - Done: Green checkmark
    - Error/Cancelled: Red alert icon
  - Fallback polling (2-second intervals) if WebSocket unavailable
  - Job progress percentage display during processing

### 5. History & Detailed Results ✓

- **File**: `/app/history/page.tsx` (updated)
- **Features**:
  - Lists all past optimization results from API
  - Click "View Details" to load result in dashboard
  - "Export" button for CSV export
  - Expandable LINGO logs viewer (retrieved via API)
  - Color-coded status indicators
  - Handles all 6 job statuses: pending, processing, done, error, cancelled

### 6. Form Validation ✓

- **File**: `/app/config/page.tsx`
- **Features**:
  - Numeric validation in matrix editor (min=0, no negative values)
  - Product form validates: P (price), D (demand), LI/LS (batch limits)
  - All inputs enforced as positive numbers

### 7. Export to CSV/PDF ✓

- **File**: `/app/dashboard/page.tsx` and `/app/history/page.tsx`
- **Features**:
  - CSV export from dashboard results table
  - CSV export from history detail view
  - PDF export (via html2canvas + jspdf)
  - Export includes profit, varieties, production quantities

## API Integration Details

### Base URLs (from environment)
- REST API: `https://pastyback.jblasc.com/api`
- WebSocket: `wss://pastyback.jblasc.com/ws`

### Key Endpoints Used

**Optimization**
```
POST /optimize - Start optimization job
GET /optimize/:job_id - Check job status
GET /optimize/queue/status - View queue
GET /results - List all results
GET /results/:id - Get specific result
GET /logs/lingo/:job_id - Get LINGO logs
```

**Products**
```
GET/POST /products
GET/PUT/DELETE /products/:id
GET/POST /products/:id/ingredients (Q matrix)
GET/POST /products/:id/machines (T matrix)
GET/POST /products/:id/operational-resources (CM matrix)
```

**Other Resources**
```
GET/POST /ingredients, GET/PUT/DELETE /ingredients/:id
GET/POST /machines, GET/PUT/DELETE /machines/:id
GET/POST /stocks, GET/PUT/DELETE /stocks/:id
GET/POST /resources, DELETE /resources/:id
```

## Job Status Handling

The app handles 6 possible job statuses:
- **pending**: Job queued, waiting to process
- **processing**: Job actively running, showing progress %
- **done**: Optimization completed successfully
- **error**: Optimization failed with error
- **cancelled**: Job was cancelled
- **completed**: Legacy status for backwards compatibility

## WebSocket Message Format

Expected message format:
```json
{
  "job_id": "uuid",
  "status": "pending|processing|done|error|cancelled",
  "progress": 0-100,
  "result": {...},
  "error": "error message"
}
```

## Component Structure

```
app/
├── page.tsx (redirects to dashboard)
├── dashboard/
│   └── page.tsx (results display + export)
├── optimize/
│   └── page.tsx (job submission + real-time status)
├── history/
│   └── page.tsx (past results + logs viewer)
└── config/
    └── page.tsx (master data + matrix editors)

components/
├── layout/
│   ├── sidebar.tsx (no logout)
│   ├── header.tsx
│   └── main-layout.tsx
├── config/
│   ├── matrix-editor.tsx (NEW)
│   └── add-item-modal.tsx
├── optimize/
│   └── optimization-status.tsx
└── dashboard/
    ├── kpi-card.tsx
    ├── results-table.tsx
    ├── resource-chart.tsx
    ├── profit-chart.tsx
    └── export-button.tsx

lib/
├── api.ts (full endpoint coverage)
├── store.ts (Zustand state)
└── utils.ts
```

## State Management

- **Zustand Store** (`/lib/store.ts`):
  - `user` - Current operator
  - `currentOptimization` - Active result
  - `optimizationStatus` - 'idle' | 'running' | 'completed' | 'failed'
  - `sidebarOpen` - Mobile navigation toggle

## Error Handling

- Toast notifications for all API operations
- Console logging with `[v0]` prefix for debugging
- Fallback UI states for loading and empty data
- WebSocket reconnection logic
- Fallback to polling if WebSocket fails

## Next Steps (Optional Enhancements)

1. Add product editing modal with P, D, LI, LS fields
2. Implement matrix export to Excel format
3. Add batch scheduling (multiple optimizations)
4. Create admin dashboard for queue management
5. Add email notifications on job completion

## Testing Checklist

- [ ] Navigate to `/config` - verify products/ingredients load from API
- [ ] Add a new product - confirm POST request succeeds
- [ ] Go to `/optimize` - submit optimization job
- [ ] Watch WebSocket updates in real-time (or polling fallback)
- [ ] Check `/history` - view past results
- [ ] Click to expand LINGO logs - verify format
- [ ] Export CSV from history - verify file downloads
- [ ] Matrix editors show when products exist - verify editable cells
- [ ] App automatically redirects `/` to `/dashboard` - no login needed

## Deployment

1. Set environment variables:
   - `NEXT_PUBLIC_API_BASE_URL=https://pastyback.jblasc.com/api`
   - `NEXT_PUBLIC_WS_URL=wss://pastyback.jblasc.com/ws`

2. Build and deploy:
   ```bash
   pnpm build
   pnpm start
   ```

3. Or deploy to Vercel:
   ```bash
   vercel deploy
   ```
