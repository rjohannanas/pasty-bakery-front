# Pasty Bakery - Production Optimization Frontend

A modern, responsive web application for optimizing bakery production schedules using advanced mathematical algorithms.

## Project Overview

This is a Next.js 16 frontend application designed to interface with the Pasty Bakery production optimization backend API. The application enables bakery operators to:

- Configure master data (products, ingredients, machines)
- Input daily production parameters and resource availability
- Execute optimization algorithms for maximum profit production
- View comprehensive results with interactive charts and analytics
- Export production plans in CSV or PDF formats
- Track historical optimization runs

## Technology Stack

- **Frontend Framework**: Next.js 16 with App Router
- **UI Components**: shadcn/ui with Tailwind CSS v4
- **State Management**: Zustand
- **Data Fetching**: SWR
- **Visualization**: Recharts
- **Styling**: Tailwind CSS with warm bakery color palette
- **Export**: jsPDF + html2canvas
- **Notifications**: Sonner
- **Authentication**: Supabase (optional, currently demo-based)
- **Real-time**: WebSocket integration

## Project Structure

```
/vercel/share/v0-project/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with auth provider
│   ├── page.tsx                 # Login page
│   ├── dashboard/               # Production dashboard
│   ├── optimize/                # Daily optimization panel
│   ├── config/                  # Configuration management
│   └── history/                 # Historical results viewer
├── components/
│   ├── auth/                    # Authentication components
│   ├── layout/                  # Header, sidebar, main layout
│   ├── dashboard/               # Dashboard charts and tables
│   ├── config/                  # Configuration modals
│   ├── optimize/                # Optimization components
│   ├── providers/               # React providers
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── api.ts                   # API client & WebSocket setup
│   ├── store.ts                 # Zustand store (global state)
│   ├── export.ts                # CSV/PDF export utilities
│   └── utils.ts                 # shadcn utility functions
├── app/globals.css              # Global styles with custom color theme
└── next.config.mjs              # Next.js configuration
```

## Key Features

### 1. Authentication & Authorization
- Demo login system with email/password
- Zustand store for user state management
- Automatic redirection based on auth status
- Logout functionality with local storage cleanup

### 2. Dashboard
- **KPI Cards**: Expected profit, varieties produced, optimization status
- **Resource Charts**: Bar charts showing capacity usage
- **Production Distribution**: Pie chart showing product quantities
- **Utilization Metrics**: Progress bars for oven, mixer, and labor hours
- **Production Table**: Detailed breakdown of recommended production by product

### 3. Daily Optimization
- Input form for daily stock levels
- Resource availability configuration
- Production target and minimum variety parameters
- Real-time optimization status with WebSocket integration
- Success/error notifications with Sonner

### 4. Configuration Management
- Product management
- Ingredient inventory setup
- Machine resources configuration
- Add/edit/delete modals for each category
- Demo data pre-populated for testing

### 5. Historical Results
- View past optimization runs
- Click to load and visualize historical data
- Sort by date and status
- Quick access to previous production plans

### 6. Export & Reporting
- **CSV Export**: Production plan in spreadsheet format
- **PDF Export**: Visual report of dashboard with charts
- Automatic filename with date
- Toast notifications on success/error

## Color Palette

The app uses a warm, inviting bakery-themed color scheme:
- **Primary**: Gold/Bronze (oklch(0.45 0.15 55))
- **Accent**: Amber/Orange (oklch(0.60 0.18 50))
- **Background**: Cream (oklch(0.98 0.004 70))
- **Text**: Chocolate Brown (oklch(0.25 0.05 25))
- **Muted**: Light Gray (oklch(0.92 0.01 70))

## API Integration

### Base Endpoints
- **API**: `https://pastyback.jblasc.com/api`
- **WebSocket**: `wss://pastyback.jblasc.com/ws`

### Key API Endpoints
- `POST /optimize` - Run optimization with parameters
- `GET /results` - Fetch all historical results
- `GET /results/:id` - Fetch specific result
- `GET/POST /products` - Product management
- `GET/POST /ingredients` - Ingredient management
- `GET/POST /machines` - Machine configuration

## Development

### Running Locally
```bash
pnpm install
pnpm dev
```

The app will be available at `http://localhost:3000`

### Building for Production
```bash
pnpm build
pnpm start
```

### Environment Variables
```env
NEXT_PUBLIC_API_BASE_URL=https://pastyback.jblasc.com/api
NEXT_PUBLIC_WS_URL=wss://pastyback.jblasc.com/ws
```

## User Flows

### 1. Daily Production Planning
1. User logs in with credentials
2. Navigates to Optimize page
3. Inputs daily stock levels for ingredients
4. Sets available resource hours
5. Specifies target production and minimum varieties
6. Clicks "Run Optimization"
7. Views real-time progress via WebSocket
8. Results auto-load in dashboard
9. Reviews charts and production table
10. Exports plan as CSV or PDF

### 2. Configuration Management
1. User navigates to Configuration page
2. Clicks "Add" in Product/Ingredient/Machine section
3. Modal opens to add new item
4. Item added to list
5. Items can be edited or deleted
6. Consumption matrices can be configured (future feature)

### 3. Historical Review
1. User navigates to History page
2. Views list of past optimization runs
3. Filters by date or status (future enhancement)
4. Clicks "View Details" on any run
5. Dashboard loads with that result's data
6. Can export historical data

## State Management

The app uses Zustand for global state:
```typescript
{
  user: User | null;
  currentOptimization: OptimizationResult | null;
  optimizationStatus: 'idle' | 'running' | 'completed' | 'failed';
  optimizationError: string | null;
  historicalResults: OptimizationResult[];
  sidebarOpen: boolean;
}
```

## Responsive Design

- **Desktop-first** with full feature set
- **Tablet optimization** with grid adjustments
- **Mobile support**:
  - Sidebar collapses to menu
  - Results table scrollable
  - Production order view optimized for kitchen display
  - Touch-friendly buttons and inputs

## Future Enhancements

1. **Supabase Auth**: Implement full authentication
2. **Consumption Matrices**: UI for Q, T, CM configuration
3. **Advanced Filtering**: Filter historical results by date range, status
4. **Real-time Notifications**: Push alerts for optimization completion
5. **Multi-user Support**: Role-based access control
6. **Data Analytics**: Trend analysis and performance metrics
7. **API Caching**: Implement SWR for better data sync
8. **Print Optimization**: Server-side PDF generation
9. **Mobile App**: React Native companion app
10. **Batch Processing**: Schedule recurring optimizations

## Deployment

The app is ready to deploy to Vercel:

1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Deploy with one click
4. Automatic deployments on git push

## Support

For API documentation and backend issues, refer to the backend API documentation at `https://pastyback.jblasc.com/api/docs`

## Notes for Development

- All API calls are configured to use environment variables
- WebSocket connection is gracefully handled with fallbacks
- CSV export uses proper RFC 4180 formatting
- PDF export handles multi-page documents
- All components are optimized for performance using React best practices
- Loading states and error handling implemented throughout
- Accessibility considerations implemented (semantic HTML, ARIA labels)

---

**Last Updated**: July 2024  
**Version**: 1.0.0  
**Status**: Production Ready
