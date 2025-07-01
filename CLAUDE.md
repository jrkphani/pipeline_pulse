# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Context
You are working on **Pipeline Pulse**, an Opportunity-to-Revenue (O2R) tracking system for 1CloudHub that integrates with Zoho CRM. This is a mission-critical business intelligence application that tracks deals through 4 phases: Opportunity to Proposal, Proposal to Commitment, Execution, and Revenue Realization.

## 📋 Mandatory Tech Stack Requirements

### Backend (Python FastAPI)
- **Framework**: FastAPI with Python 3.9+
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens, Zoho OAuth2 integration
- **API Documentation**: Automatic OpenAPI/Swagger generation
- **Dependencies**: Pydantic for data validation, Alembic for migrations
- **Structure**: Follow existing app/ directory structure with models/, services/, api/endpoints/

### Frontend (React + TypeScript)
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui components only
- **State Management**: TanStack Query (React Query) for server state, React hooks for local state
- **Styling**: Tailwind CSS (use utility classes only)
- **Routing**: React Router v6
- **Icons**: Lucide React icons

### Infrastructure (AWS)
- **Deployment**: AWS with CDK/CloudFormation
- **Database**: AWS RDS PostgreSQL
- **Storage**: S3 for static files
- **Authentication**: AWS Cognito (if not using Zoho OAuth)
- **Monitoring**: CloudWatch
- **CDN**: CloudFront for frontend assets

## Build and Development Commands

### Frontend Development
```bash
cd frontend
npm install              # Install dependencies
npm run dev              # Start Vite dev server on port 5173
npm run build            # Run TypeScript check + Vite production build
npm run lint             # Run ESLint with TypeScript rules
npm run preview          # Preview production build
```

### Backend Development
```bash
cd backend
pip install -r requirements.txt     # Install Python dependencies
uvicorn main:app --reload --port 8000  # Start FastAPI dev server
python -m pytest                    # Run all tests
python -m pytest -v test_zoho_integration.py  # Run specific test file
alembic upgrade head                # Run database migrations
```

### Testing Commands
```bash
# Frontend E2E Testing (from frontend/ directory)
npx playwright test                 # Run all Playwright tests
npx playwright test --headed        # Run tests with browser UI
npx playwright test test.spec.js    # Run specific test file
npx playwright show-report          # View test report

# Backend Testing (from backend/ directory)  
python -m pytest -v                 # Run all tests with verbose output
python -m pytest -k "test_name"     # Run tests matching pattern
python -m pytest --asyncio-mode=auto  # Run async tests
```

## Architecture Overview

### Frontend Architecture
The frontend is a React TypeScript application using Vite as the build tool. Key architectural patterns:

- **Component Structure**: UI components in `src/components/` use shadcn/ui built on Radix UI primitives
- **Pages**: Main application pages in `src/pages/` handle routing and data orchestration
- **API Integration**: All API calls go through `src/services/api.ts` using axios with interceptors
- **State Management**: React Query for server state, custom hooks for client state
- **Type Safety**: TypeScript types in `src/types/` define all data structures
- **Styling**: Tailwind CSS with custom configuration and component variants

### Backend Architecture
The backend is a FastAPI Python application with a modular structure:

- **API Layer**: FastAPI routes in `app/api/` handle HTTP requests
- **Service Layer**: Business logic in `app/services/` for data processing and integrations
- **Model Layer**: SQLAlchemy models in `app/models/` define database schema
- **Core**: Configuration and database setup in `app/core/`
- **Authentication**: SAML-based auth in `app/auth/` for enterprise SSO
- **Scheduler**: Background tasks via `scheduler_service.py` for automated refreshes

### Key Integration Points

1. **Zoho CRM Integration**
   - OAuth2 authentication flow with refresh tokens
   - Direct API calls via `zoho_service.py` for deal management
   - Bulk update capabilities with queuing and sync status tracking
   - Field mapping configuration for custom fields

2. **Currency Conversion System**
   - Automated SGD standardization using forex-python
   - Rate caching in database with periodic updates
   - Historical rate storage for consistent reporting

3. **O2R (Opportunity-to-Revenue) Module**
   - Separate data models for opportunities, phases, milestones
   - Health scoring algorithm based on timeline and progress
   - Import/export functionality with field mapping
   - Review engine for automated health assessments

4. **API Proxy Configuration**
   - Frontend API calls to `/api/*` are proxied to backend port 8000
   - Configured in `vite.config.ts` for development
   - Production deployment requires proper reverse proxy setup

## 🏗️ Architecture Constraints

### Database Design
- Use PostgreSQL with proper foreign key relationships
- Include UUID primary keys where specified
- Follow existing schema patterns from documentation
- Include proper indexes for performance
- Use JSONB for flexible metadata storage

### API Design
- RESTful endpoints with proper HTTP methods
- Consistent response formats with error handling
- Pagination for list endpoints (limit/offset)
- Input validation with Pydantic models
- Background tasks for long-running operations

### Frontend Patterns
- Functional components with hooks only
- TypeScript interfaces for all data structures
- shadcn/ui components (Card, Button, Input, Select, etc.)
- Consistent error handling with toast notifications
- Loading states and optimistic updates

## 📊 Critical Business Requirements

### Data Model Compliance
- **10 mapped fields** from Zoho CRM CSV (Territory, Service Line, AWS Funded Tag, etc.)
- **4-phase tracking**: Proposal Date, PO Date, Kickoff Date, Invoice Date, Payment Date, Revenue Date
- **Health signals**: Calculate based on phase delays (🟢 on track, 🟡 at risk, 🔴 overdue)
- **Phase progression**: Automatic status calculation based on milestone dates

### Zoho CRM Integration
- OAuth2 authentication flow
- Bulk update operations (max 100 records per API call)
- Field validation against Zoho schema
- Sync status tracking (local → CRM)
- Error handling for API rate limits

### Performance Requirements
- Handle 1000+ opportunity records
- Sub-second dashboard loading
- Efficient pagination and filtering
- Background sync operations
- Real-time progress tracking

## 🚫 Strict Prohibitions

### Tech Stack Violations
- ❌ NO other UI libraries (Material-UI, Ant Design, Chakra, etc.)
- ❌ NO other CSS frameworks (Bootstrap, Bulma, etc.)
- ❌ NO custom CSS files (use Tailwind utilities only)
- ❌ NO class components (functional components only)
- ❌ NO other state management (Redux, Zustand, Valtio)

### Code Quality Issues
- ❌ NO hardcoded values (use environment variables)
- ❌ NO inline styles
- ❌ NO TODO comments without GitHub issues
- ❌ NO console.log in production code
- ❌ NO missing error handling
- ❌ NO untyped functions/components

### Data Handling Violations
- ❌ NO client-side data mutations without server sync
- ❌ NO localStorage for sensitive data
- ❌ NO direct database queries from frontend
- ❌ NO missing input validation
- ❌ NO SQL injection vulnerabilities

## ✅ Required Implementation Patterns

### Backend Patterns
```python
# Required imports and structure
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.bulk_update import BulkUpdateRequest
from app.services.zoho_service import ZohoService

# Required error handling
try:
    result = await some_operation()
    return {"status": "success", "data": result}
except Exception as e:
    logger.error(f"Operation failed: {str(e)}")
    raise HTTPException(status_code=500, detail=str(e))
```

### Frontend Patterns
```tsx
// Required imports and structure
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

// Required component structure
export const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  const { toast } = useToast();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['key'],
    queryFn: () => api.getData()
  });

  if (isLoading) return <div className="animate-pulse">Loading...</div>;
  if (error) return <div className="text-destructive">Error: {error.message}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Content */}
      </CardContent>
    </Card>
  );
};
```

## 📋 Implementation Checklist

Before implementing any feature, ensure:

### Backend Development
- [ ] API endpoint follows RESTful conventions
- [ ] Pydantic models for request/response validation
- [ ] SQLAlchemy models with proper relationships
- [ ] Error handling with appropriate HTTP status codes
- [ ] Database migrations with Alembic
- [ ] Authentication/authorization checks
- [ ] Logging for debugging and monitoring

### Frontend Development
- [ ] TypeScript interfaces for all data structures
- [ ] shadcn/ui components only
- [ ] TanStack Query for API calls
- [ ] Proper loading and error states
- [ ] Responsive design with Tailwind
- [ ] Accessibility considerations
- [ ] Form validation with react-hook-form

### Integration Requirements
- [ ] Zoho CRM API integration tested
- [ ] Database operations are atomic
- [ ] Background tasks for long operations
- [ ] Progress tracking for bulk operations
- [ ] Proper error recovery mechanisms

## 🎯 Specific Feature Requirements

### Bulk Update Feature
- Field validation against Zoho CRM schema
- Multi-select record interface
- Progress tracking with real-time updates
- Rollback capability for failed operations
- Audit trail for all changes

### Dashboard Components
- 4-phase opportunity tracking
- Health signal calculations
- Territory and service line filtering
- Real-time data updates
- Export capabilities

### Data Synchronization
- Bi-directional sync with Zoho CRM
- Conflict resolution strategies
- Retry mechanisms for failed syncs
- Status monitoring and alerts

## Important Patterns and Conventions

1. **Error Handling**: All API endpoints return consistent error responses with status codes
2. **Authentication**: Check user permissions via `PermissionGate` component and `permission_service.py`
3. **Data Validation**: Pydantic models for request/response validation, Zod for frontend forms
4. **File Uploads**: Handled via `file_service.py` with virus scanning and size limits
5. **Database Migrations**: Use Alembic for schema changes, never modify models directly in production
6. **Testing**: Integration tests for API endpoints, E2E tests for critical user flows
7. **Currency Handling**: Always store amounts in SGD, convert on display as needed
8. **Date Handling**: UTC storage, local timezone display using date-fns
9. **Bulk Operations**: Use queuing system for large updates to prevent timeouts
10. **CSV Processing**: Pandas for data analysis, strict column validation for imports

## 🔧 Development Workflow

1. **Analysis**: Review existing codebase patterns
2. **Design**: Create TypeScript interfaces and API schemas
3. **Backend**: Implement FastAPI endpoints with proper validation
4. **Frontend**: Build React components with shadcn/ui
5. **Integration**: Connect frontend to backend APIs
6. **Testing**: Unit tests, integration tests, E2E tests
7. **Documentation**: Update API docs and component documentation
8. **Deployment**: AWS CDK infrastructure updates

Remember: This is a business-critical application for 1CloudHub. Prioritize reliability, performance, and maintainability over rapid development. Every line of code should follow the established patterns and contribute to the overall system architecture.

---

# 🚀 **TRANSITION TO LIVE CRM ARCHITECTURE**

## 🎯 **New System Flow**

```
Zoho CRM ←→ Pipeline Pulse ←→ User Dashboard
    ↓           ↓              ↓
Real-time   Live Analysis   Interactive
  Data      & O2R Tracking   Insights
```

## 🔄 **Data Flow Architecture**

### **1. CRM Data Ingestion**
```typescript
interface CRMDataSync {
  // Automated sync every 15 minutes
  scheduleSync(): void;
  
  // Manual refresh option
  manualSync(): Promise<SyncResult>;
  
  // Real-time webhook handling
  handleWebhook(event: ZohoWebhookEvent): void;
  
  // Delta sync for efficiency
  getDeltaChanges(since: Date): Promise<Deal[]>;
}
```

### **2. Live Pipeline Analytics**
```typescript
interface LivePipelineService {
  // Real-time dashboard data
  getDashboardData(): Promise<DashboardMetrics>;
  
  // Live filtering without file uploads
  getFilteredPipeline(filters: PipelineFilters): Promise<FilteredResults>;
  
  // Auto-refresh capabilities
  subscribeToUpdates(callback: (data: PipelineUpdate) => void): void;
}
```

### **3. Enhanced O2R Tracker**
```typescript
interface LiveO2RTracker {
  // Sync O2R data from CRM custom fields
  syncO2RMilestones(): Promise<O2ROpportunity[]>;
  
  // Update milestones back to CRM
  updateMilestone(oppId: string, milestone: Milestone): Promise<void>;
  
  // Real-time health monitoring
  calculateHealthSignals(): Promise<HealthReport>;
}
```

## 🚀 **Implementation Steps**

### **Phase 1: Remove Upload System**
- [ ] Remove upload endpoints and components
- [ ] Remove CSV processing logic
- [ ] Remove file storage mechanisms
- [ ] Clean up database tables for uploads

### **Phase 2: Enhance Zoho Integration**
- [ ] Expand Zoho API service
- [ ] Add automated sync scheduler
- [ ] Implement webhook handling
- [ ] Add real-time data caching

### **Phase 3: Live Dashboard**
- [ ] Convert dashboard to real-time data
- [ ] Add auto-refresh functionality
- [ ] Implement live filtering
- [ ] Add connection status indicators

### **Phase 4: Enhanced O2R**
- [ ] Map O2R fields to Zoho custom fields
- [ ] Add bidirectional sync
- [ ] Implement milestone tracking
- [ ] Add automated health monitoring

## 📊 **New User Experience**

### **Dashboard Flow**
1. **Connect to CRM** → One-time Zoho authentication
2. **Auto-Sync Data** → Scheduled background updates
3. **Live Analysis** → Real-time pipeline insights
4. **Interactive O2R** → Milestone tracking with CRM sync
5. **Export Reports** → Generate insights from live data

### **Key Benefits**
- 🔄 **Always Current**: Data is never stale
- ⚡ **Real-time Insights**: Live dashboard updates
- 🎯 **Single Source**: CRM is the authoritative source
- 🔧 **Bidirectional**: Update CRM from Pipeline Pulse
- 📈 **Enhanced O2R**: Milestone tracking integrated with CRM

## 🛠️ **Technical Implementation**

### **Backend Changes**
```python
# New CRM service architecture
class ZohoCRMService:
    async def get_all_deals(self) -> List[Deal]:
        """Fetch all deals from Zoho CRM"""
    
    async def sync_pipeline_data(self) -> SyncResult:
        """Full pipeline data synchronization"""
    
    async def update_deal_milestones(self, deal_id: str, milestones: Dict) -> bool:
        """Update O2R milestones in CRM"""
    
    async def setup_webhooks(self) -> bool:
        """Configure Zoho webhooks for real-time updates"""

# Background sync scheduler
class DataSyncScheduler:
    def schedule_regular_sync(self):
        """Every 15 minutes sync"""
    
    def handle_webhook_updates(self):
        """Real-time change processing"""
```

### **Frontend Changes**
```typescript
// Real-time dashboard hooks
const useLivePipeline = () => {
  const [data, setData] = useState<PipelineData>();
  const [lastSync, setLastSync] = useState<Date>();
  
  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
};

// Live connection status
const useConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date>();
  
  return { isConnected, lastSyncTime, triggerSync };
};
```

## 🎯 **New Features to Add**

### **1. Connection Dashboard**
- CRM connection status
- Last sync timestamp
- Data freshness indicators
- Manual sync triggers

### **2. Real-time Notifications**
- Deal stage changes
- Milestone completions
- Health signal alerts
- Sync status updates

### **3. Enhanced O2R Integration**
- Custom field mapping interface
- Milestone template configuration
- Automated health monitoring
- CRM field validation

### **4. Live Export System**
- Real-time report generation
- Scheduled report delivery
- Export with current filters
- Historical trend analysis

## 🔧 **Configuration Requirements**

### **Zoho CRM Setup**
```json
{
  "required_custom_fields": [
    "Territory",
    "Service_Line", 
    "Strategic_Account",
    "AWS_Funded",
    "Alliance_Motion",
    "Proposal_Date",
    "SOW_Date",
    "PO_Date",
    "Kickoff_Date",
    "Invoice_Date",
    "Payment_Date",
    "Revenue_Date"
  ],
  "required_permissions": [
    "ZohoCRM.modules.deals.READ",
    "ZohoCRM.modules.deals.WRITE",
    "ZohoCRM.settings.fields.READ",
    "ZohoCRM.notifications.CREATE"
  ]
}
```

### **Webhook Configuration**
```javascript
// Zoho webhook events to subscribe to
const webhookEvents = [
  'Deals.create',
  'Deals.edit', 
  'Deals.delete',
  'Deals.approval',
  'Deals.workflow'
];
```

## 🗑️ **Files to Remove in Transition**

### **Backend Files to Remove:**
```bash
# API endpoints to remove
rm backend/app/api/endpoints/upload.py
rm backend/app/api/endpoints/bulk_update.py

# Services to remove
rm backend/app/services/bulk_update_service.py
rm backend/app/services/file_service.py

# Models to remove
rm backend/app/models/bulk_update.py

# Remove upload directory
rm -rf backend/uploads/

# Remove migration files for bulk update
rm backend/alembic/versions/003_add_bulk_update_tables.py
```

### **Frontend Files to Remove:**
```bash
# Remove upload page
rm frontend/src/pages/Upload.tsx

# Remove bulk update system
rm frontend/src/pages/BulkUpdate.tsx
rm -rf frontend/src/components/bulk-update/
rm frontend/src/services/bulkUpdateApi.ts
rm frontend/src/types/bulkUpdate.ts
```

## 🔄 **Enhanced Zoho Service Pattern**

```python
class EnhancedZohoService:
    async def get_all_deals(self, fields: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Fetch all deals from Zoho CRM with pagination"""
        
    async def get_deals_modified_since(self, since_time: datetime) -> List[Dict[str, Any]]:
        """Get deals modified since specific time (for delta sync)"""
        
    async def update_deal(self, deal_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a deal in Zoho CRM"""
        
    async def setup_webhooks(self) -> bool:
        """Configure Zoho webhooks for real-time updates"""
        
    def transform_zoho_deal_to_pipeline_deal(self, zoho_deal: Dict[str, Any]) -> Dict[str, Any]:
        """Transform Zoho CRM deal format to Pipeline Pulse format"""
```

## 📅 **Background Sync Service Pattern**

```python
class DataSyncService:
    async def start_scheduled_sync(self):
        """Start the background sync scheduler"""
        
    async def full_sync(self) -> Dict[str, Any]:
        """Perform full synchronization with Zoho CRM"""
        
    async def delta_sync(self) -> Dict[str, Any]:
        """Perform delta synchronization (only changed records)"""
        
    async def _sync_o2r_opportunities(self, deals: List[Dict[str, Any]]):
        """Sync deals to O2R opportunities"""
```

## 🎯 **Live Frontend Hook Pattern**

```typescript
export const useLivePipeline = () => {
  const queryClient = useQueryClient()
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['live-pipeline'],
    queryFn: async () => {
      const response = await fetch('/api/zoho/live-pipeline')
      if (!response.ok) throw new Error('Failed to fetch pipeline data')
      return response.json()
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
  })
  
  const triggerSync = useCallback(async () => {
    // Manual sync implementation
  }, [queryClient])
  
  return { data, syncStatus, isLoading, error, triggerSync, refetch }
}
```

This refactored approach transforms Pipeline Pulse into a true **live CRM analytics platform** rather than a CSV processing tool, while maintaining the valuable O2R tracking capabilities.