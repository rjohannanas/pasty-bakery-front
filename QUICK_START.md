# Quick Start Guide - Pasty Bakery Frontend

## 30-Second Setup

```bash
cd /vercel/share/v0-project
pnpm install
pnpm dev
# App runs at http://localhost:3000
```

## App Flows

### 1. **Configure Master Data** → `/config`
```
View Products/Ingredients/Machines 
  ↓
Add/Delete items (via modal)
  ↓
Edit Q Matrix (ingredient consumption)
  ↓
Matrix cells auto-save on blur
```

**API Calls**: GET /products, POST /products, DELETE /products/:id, POST /products/:id/ingredients

---

### 2. **Run Optimization** → `/optimize`
```
Enter daily stock levels
  ↓
Set available resources
  ↓
Configure parameters (target production, min variety)
  ↓
Click "Run Optimization"
  ↓
Watch real-time status (WebSocket or polling)
  ↓
Auto-redirect to dashboard when done
```

**API Calls**: POST /optimize, then GET /optimize/:job_id every 2s (or WebSocket updates)

---

### 3. **View Results** → `/dashboard`
```
See KPI cards (profit, varieties, status)
  ↓
View results table with production plan
  ↓
See resource utilization charts
  ↓
Click "Export Report" for CSV
```

**API Calls**: Already loaded from optimization

---

### 4. **Review History** → `/history`
```
List all past optimization runs
  ↓
Click result to load in dashboard
  ↓
Click "Show LINGO Logs" to see solver output
  ↓
Click "Export" to download CSV
```

**API Calls**: GET /results, GET /results/:id, GET /logs/lingo/:job_id

---

## Key URLs

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/dashboard` | View results |
| Optimize | `/optimize` | Run new optimization |
| History | `/history` | Past results + logs |
| Config | `/config` | Master data + matrices |

---

## API Base URLs

```javascript
const API = 'https://pastyback.jblasc.com/api'
const WS = 'wss://pastyback.jblasc.com/ws'
```

---

## Job Status Indicators

| Status | Icon | Color | Meaning |
|--------|------|-------|---------|
| pending | ⏰ | Amber | Queued |
| processing | ⚡ | Blue | Running |
| done | ✓ | Green | Success |
| error | ⚠️ | Red | Failed |
| cancelled | ⚠️ | Red | Cancelled |

---

## Matrix Editors

### Q Matrix (Ingredient Consumption)
- **Location**: `/config` (below master data)
- **Rows**: Products
- **Columns**: Ingredients
- **Unit**: kg
- **Edit**: Click cell → type value → blur to save

### T Matrix (Machine Time)
- **Location**: `/config` (below Q Matrix)
- **Rows**: Products
- **Columns**: Machines
- **Unit**: minutes
- **Edit**: Click cell → type value → blur to save

### CM Matrix (Operational Resources)
- **Location**: `/config` (optional, expandable)
- **Rows**: Products
- **Columns**: Resources
- **Unit**: custom units
- **Status**: Ready for implementation

---

## Debugging Tips

### Check API Calls
1. Open DevTools → Network tab
2. Filter by `pastyback.jblasc.com`
3. See request/response for each operation

### Check WebSocket
1. Open DevTools → Network tab
2. Look for WebSocket connection (green = open)
3. Check Messages tab for real-time updates

### Check Logs
1. Open Console
2. Filter by `[v0]` prefix
3. See all debug messages

### Check State
1. Install React DevTools Extension
2. Find "Provider" → "Zustand Store"
3. See current app state

---

## Common Tasks

### Add a New Product
```
1. Go to /config
2. Click + next to "Products"
3. Enter product name
4. Click "Add Product"
5. See it in the list
```

### Define Q Matrix for Product
```
1. Go to /config
2. Scroll to Q Matrix
3. Find Product row
4. Click ingredient column cell
5. Enter kg amount
6. Cell auto-saves
```

### Run Optimization
```
1. Go to /optimize
2. Update stock levels (or use defaults)
3. Update resources (or use defaults)
4. Click "Run Optimization"
5. Watch status indicator
6. Wait for redirect to dashboard
```

### View Past Result
```
1. Go to /history
2. Find result in list
3. Click "View Details"
4. See full dashboard for that result
```

### Download Report
```
1. Go to /dashboard or /history
2. Click "Export Report"
3. CSV file downloads
4. Open in Excel/Google Sheets
```

### View LINGO Logs
```
1. Go to /history
2. Find result
3. Click "Show LINGO Logs"
4. See solver output
5. Click to collapse
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Enter | Submit form / Save matrix cell |
| Tab | Move to next cell |
| Escape | Cancel modal |
| Ctrl+S | Export (on dashboard) |

---

## Mobile Support

- ✅ Responsive on mobile
- ✅ Touch-friendly buttons
- ✅ Stacked layout on small screens
- ✅ Sidebar collapses to hamburger menu
- ⚠️ Matrix editors best on tablet+ (wide screen)

---

## Production Deployment

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Or deploy to Vercel
vercel deploy --prod
```

**Important**: Set environment variables in Vercel:
```
NEXT_PUBLIC_API_BASE_URL=https://pastyback.jblasc.com/api
NEXT_PUBLIC_WS_URL=wss://pastyback.jblasc.com/ws
```

---

## Troubleshooting

**Q: App shows "No authentication"?**
- A: Expected! App has no login. You're automatically logged in as operator.

**Q: Matrix editor cells don't save?**
- A: Check Network tab. POST request should show for /products/:id/ingredients

**Q: WebSocket shows error?**
- A: Fallback polling will work. App polls every 2 seconds. Check Network tab.

**Q: History shows no results?**
- A: Run an optimization first. Go to /optimize → Run → Then check /history

**Q: Export doesn't download?**
- A: Check browser download folder. Check for blocked popups in browser settings.

**Q: Status never changes from "pending"?**
- A: Check Network tab. POST /optimize should return job_id. Backend may be slow.

---

## File Structure for Developers

```
Key Components:
├── app/
│   ├── page.tsx → Redirect to /dashboard
│   ├── dashboard/ → Results display
│   ├── optimize/ → Job submission + WebSocket
│   ├── history/ → Past results viewer
│   └── config/ → Master data + matrices

State Management:
├── lib/
│   ├── store.ts → Zustand store
│   ├── api.ts → API client (40+ endpoints)
│   └── export.ts → CSV/PDF export utils

UI Components:
├── components/
│   ├── config/matrix-editor.tsx → Spreadsheet
│   ├── optimize/optimization-status.tsx → Status display
│   └── dashboard/[various] → Charts & tables
```

---

## Documentation Files

| File | Purpose |
|------|---------|
| `IMPLEMENTATION_NOTES.md` | Technical architecture |
| `TESTING_GUIDE.md` | Feature testing checklist |
| `DELIVERY_SUMMARY.md` | Complete project overview |
| `QUICK_START.md` | This file |

---

## Support

For issues or questions:
1. Check console for `[v0]` debug messages
2. Check Network tab for API calls
3. Review TESTING_GUIDE.md for common issues
4. Check IMPLEMENTATION_NOTES.md for technical details

---

## Success Indicators

✅ App starts at `http://localhost:3000`
✅ Redirects to `/dashboard` (no login)
✅ `/config` loads products/ingredients from API
✅ Can submit optimization and see status
✅ `/history` shows past results
✅ Export downloads CSV file
✅ No console errors

**If all ✅, you're ready to go!**

---

Happy optimizing! 🚀
