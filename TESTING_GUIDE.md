# Testing Guide - Pasty Bakery Frontend

## Quick Start

The app is accessible at `http://localhost:3000` and automatically redirects to the dashboard (no login required).

## Feature Testing

### 1. Configuration (Matrix Editors) 
**URL**: `http://localhost:3000/config`

**What to test**:
- [ ] Products, ingredients, and machines list displays
- [ ] "Add Product" button opens modal
- [ ] Entering a product name and submitting creates it in the table
- [ ] Delete button removes items
- [ ] When products and ingredients exist, "Q Matrix" spreadsheet appears
- [ ] Q Matrix is editable - click on cell, enter value, blur to trigger save
- [ ] Can see API calls in Network tab for POST requests

**Expected API Calls**:
- `GET /products` - fetch list
- `GET /ingredients` - fetch list
- `GET /machines` - fetch list
- `POST /products` - add new
- `DELETE /products/:id` - remove
- `POST /products/:id/ingredients` - save matrix cell

---

### 2. Optimization (WebSocket) 
**URL**: `http://localhost:3000/optimize`

**What to test**:
- [ ] Page displays form fields for stock, resources, parameters
- [ ] Click "Run Optimization" button
- [ ] In Network tab, see `POST /optimize` request with job parameters
- [ ] WebSocket tab (DevTools) shows connection opening
- [ ] Status indicator shows "Pending" with amber clock icon
- [ ] After a moment, status changes to "Processing" with progress bar (if backend returns progress)
- [ ] When complete, status shows "Done" with green checkmark
- [ ] After ~1.5 seconds, automatically redirects to dashboard
- [ ] If error, status shows "Error" with red alert icon

**Expected Sequence**:
1. `POST /optimize` → returns `job_id`
2. WebSocket messages with status updates
3. `GET /optimize/:job_id` (polling fallback every 2s)
4. Final `GET /results/:id` to get detailed result
5. Redirect to dashboard

**Debug Tips**:
- Open DevTools → Network tab → filter for WebSocket
- Check Console for `[v0]` debug messages
- Look for "Poll status" messages if WebSocket unavailable

---

### 3. Dashboard (Results Display)
**URL**: `http://localhost:3000/dashboard`

**What to test**:
- [ ] KPI cards show expected profit, varieties, status
- [ ] Results table displays products and quantities
- [ ] Resource chart shows bar graph (actual vs capacity)
- [ ] Profit chart shows pie chart of revenue distribution
- [ ] "Export Report" button downloads CSV file
- [ ] CSV contains optimization results in expected format

**Expected Behavior**:
- If no optimization has run: "No results yet" message
- After running optimization: full dashboard with data
- Export creates file like `optimization-1234567890.csv`

---

### 4. History (Past Results & Logs)
**URL**: `http://localhost:3000/history`

**What to test**:
- [ ] List of past optimization results displays
- [ ] Each result shows date, profit, varieties count, status
- [ ] "View Details" button loads result into dashboard
- [ ] "Export" button downloads CSV for that result
- [ ] "Show LINGO Logs" button expands logs section
- [ ] Logs display retrieved from `GET /logs/lingo/:job_id`
- [ ] Logs are monospace formatted code
- [ ] Status colors: green for done, red for error, amber for pending

**Expected Behavior**:
- First time: "No optimization history yet" message
- After first optimization: result appears in list
- Clicking result shows its details in dashboard
- Logs section has log output from LINGO solver

**API Calls Expected**:
- `GET /results` - fetch history list
- `GET /results/:id` - get detailed result
- `GET /logs/lingo/:job_id` - fetch solver logs

---

## API Response Validation

### Optimization Result Object
Should contain:
```javascript
{
  id: "uuid",
  timestamp: "2025-...",
  quantity_to_produce: { "Product1": 100, ... },
  batch_active: { "Product1": 1, ... },
  variety_flag: { "Product1": true, ... },
  expected_profit: 5000.50,
  status: "done|pending|processing|error|cancelled"
}
```

### Job Status Update (WebSocket)
Should contain:
```javascript
{
  job_id: "uuid",
  status: "processing",
  progress: 45,  // 0-100
  result: {...}  // optional, sent on done
}
```

---

## Common Issues & Debugging

### Issue: "WebSocket connection failed"
**Solution**: 
- Check if `wss://pastyback.jblasc.com/ws` is accessible
- Fallback polling will still work (2s intervals)
- Check browser console for connection errors

### Issue: "Failed to load configuration" on /config
**Solution**:
- Verify API base URL is correct: `https://pastyback.jblasc.com/api`
- Check Network tab for 404 errors
- Check browser console for CORS issues

### Issue: Optimization doesn't complete
**Solution**:
- Check Network tab for POST /optimize response
- Verify job_id was returned
- Check WebSocket/polling messages for status
- Look for errors in Network → Response tabs

### Issue: Logs not showing on /history
**Solution**:
- Verify `GET /logs/lingo/:job_id` returns data
- Check if job_id is correct
- Some jobs may not have logs (early failure)
- Logs section says "No logs available" if none returned

---

## Performance Checklist

- [ ] Initial page load < 2 seconds
- [ ] Dashboard renders with 100+ results items without lag
- [ ] Matrix editor responsive on cell input
- [ ] Export button downloads within 1 second
- [ ] WebSocket message processing doesn't cause jank
- [ ] Progress bar smoothly animates

---

## Browser Compatibility

Tested on:
- Chrome 90+ ✓
- Firefox 88+ ✓
- Safari 14+ ✓
- Edge 90+ ✓

**WebSocket Support**: Requires modern browser (IE11 not supported)

---

## Automated Testing (Optional)

### Unit Tests
Run: `pnpm test`

Currently configured tests:
- API client endpoint validation
- Store state mutations
- Component rendering

### E2E Tests
Run: `pnpm e2e`

Current coverage:
- Full optimization flow
- Matrix editor interactions
- History filtering and export

---

## Monitoring & Logs

### Console Debug Logging
All debug info prefixed with `[v0]`:
```
[v0] WebSocket connected
[v0] Optimization error: Error message
[v0] Poll status: processing 45%
[v0] Error parsing stored user: ...
```

### Network Tab Analysis
Filter requests to see:
1. `POST /optimize` - Request body has daily_stock, resources
2. `GET /results` - Check Response for array format
3. WebSocket - Green/closed status indicator

### Storage
- No localStorage used for sensitive data
- Session stored in Zustand store only
- Can inspect state via DevTools Extension

---

## Final Checklist Before Deployment

- [ ] All TypeScript errors resolved: `pnpm tsc --noEmit`
- [ ] App builds: `pnpm build`
- [ ] No console errors on page load
- [ ] Config page fetches real data
- [ ] Optimization starts and shows status
- [ ] WebSocket connects (or polling fallback works)
- [ ] History lists past results
- [ ] Exports work and download files
- [ ] All links navigate correctly
- [ ] Mobile responsive works (viewport 375px+)

---

## Deployment Verification

After deploying to production:

1. **Smoke Test**
   - Navigate to https://your-domain.com
   - Should redirect to /dashboard
   - Check Network tab - all requests successful

2. **API Integration Test**
   - Go to /config
   - Verify products/ingredients load
   - Add a new item
   - Confirm POST request succeeds

3. **WebSocket Test**
   - Go to /optimize
   - Submit optimization
   - Check DevTools WebSocket tab
   - Verify real-time status updates

4. **Export Test**
   - Go to /history
   - Click Export on any result
   - Verify CSV downloads

---

Good luck! 🚀
