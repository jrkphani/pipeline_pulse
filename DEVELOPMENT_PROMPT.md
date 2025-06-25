# Pipeline Pulse - Live CRM Integration Development Specification

## Project Overview
**Pipeline Pulse** is a comprehensive revenue intelligence platform that transforms Zoho CRM data into actionable insights through real-time integration. The application provides live pipeline analytics, O2R (Opportunity-to-Revenue) tracking, and bidirectional CRM synchronization with enhanced health monitoring and data quality intelligence.

## Core Architecture: Live CRM Integration

### System Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Zoho CRM      │◄──►│ Pipeline Pulse  │◄──►│ O2R Tracker     │
│   (API v8)      │    │ Live Sync       │    │                 │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Deals         │    │ • API Client    │    │ • Opportunities │
│ • Custom Fields │    │ • Health Monitor│    │ • Milestones    │
│ • Webhooks      │    │ • Background    │    │ • Health Signals│
│ • Milestones    │    │   Sync (15min)  │    │ • CRM Sync      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Frontend Specification

### Technology Stack
- **React 18** with TypeScript
- **Vite** for development and building
- **shadcn/ui** + **Pipeline Pulse Design System**
- **Tailwind CSS** with custom business intelligence tokens
- **React Query (@tanstack/react-query)** for live data management
- **Recharts** for data visualization

### Core Pages & Components

#### 1. **Live Dashboard** (`/`)
```typescript
interface DashboardProps {
  liveData: LivePipelineData;
  syncStatus: SyncStatus;
  connectionHealth: ConnectionHealth;
}

interface LivePipelineData {
  deals: Deal[];
  summary: PipelineSummary;
  lastSync: Date;
  dataFreshness: number; // seconds since last sync
}

interface SyncStatus {
  isConnected: boolean;
  lastSync: Date | null;
  syncInProgress: boolean;
  nextSyncIn: number;
  errorCount: number;
}
```

**Dashboard Features:**
- Real-time pipeline metrics with live sync indicators
- Connection status with health monitoring
- Territory and service line breakdown
- Interactive deal exploration with CRM linking
- Manual sync triggers with progress indication

#### 2. **CRM Sync Management** (`/crm-sync`)
```typescript
interface CRMSyncProps {
  apiVersion: 'v6' | 'v8';
  healthStatus: HealthReport;
  fieldValidation: FieldValidationResult;
  syncHistory: SyncHistoryEntry[];
}

interface HealthReport {
  overall_status: 'healthy' | 'warning' | 'critical';
  checks: HealthCheck[];
  timestamp: string;
  duration_seconds: number;
}
```

**Sync Management Features:**
- Comprehensive health monitoring dashboard
- Custom field validation and setup guidance
- API connectivity testing
- Sync history and trend analysis
- Webhook configuration management

#### 3. **O2R Tracker** (`/o2r`)
```typescript
interface O2RTrackerProps {
  opportunities: O2ROpportunity[];
  syncStatus: O2RSyncStatus;
  healthSignals: HealthSignalSummary;
}

interface O2ROpportunity {
  id: string;
  deal_name: string;
  account_name: string;
  sgd_amount: number;
  current_phase: OpportunityPhase;
  health_signal: HealthSignalType;
  milestones: MilestoneData;
  action_items: string[];
  last_updated: Date;
}
```

**O2R Features:**
- Milestone tracking with CRM sync
- Health signal management (Green/Yellow/Red/Blocked)
- Bidirectional CRM synchronization
- Phase progression monitoring
- Action item management

### Design System: Pipeline Pulse UI

#### Color Palette (Business Intelligence Focus)
```css
:root {
  /* Revenue & Success */
  --revenue-green: #16a34a;
  --revenue-green-light: #22c55e;
  --success: #10b981;
  --success-light: #34d399;

  /* Pipeline & Information */
  --pipeline-blue: #2563eb;
  --pipeline-blue-light: #3b82f6;
  --info: #0ea5e9;
  --info-light: #38bdf8;

  /* Opportunity & Warning */
  --opportunity-amber: #d97706;
  --opportunity-amber-light: #f59e0b;
  --warning: #eab308;
  --warning-light: #facc15;

  /* Risk & Critical */
  --risk-red: #dc2626;
  --risk-red-light: #ef4444;
  --destructive: #f87171;

  /* Forecast & Analytics */
  --forecast-purple: #7c3aed;
  --forecast-purple-light: #8b5cf6;
}
```

#### Component Guidelines
- **MetricCard**: Live data display with trend indicators
- **ConnectionStatus**: Real-time CRM connection health
- **SyncIndicator**: Background sync progress and status
- **HealthSignal**: Color-coded opportunity health status
- **MilestoneTracker**: O2R phase progression visualization

### Data Flow Architecture

#### Live Data Management
```typescript
// React Query hook for live pipeline data
const useLivePipeline = () => {
  return useQuery({
    queryKey: ['live-pipeline'],
    queryFn: () => fetch('/api/zoho/live-pipeline').then(res => res.json()),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000 // 2 minutes
  });
};

// Manual sync trigger
const useSyncTrigger = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => fetch('/api/zoho/sync', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-pipeline'] });
    }
  });
};
```

#### Connection Status Management
```typescript
const useConnectionHealth = () => {
  return useQuery({
    queryKey: ['connection-health'],
    queryFn: () => fetch('/api/zoho/health-check').then(res => res.json()),
    refetchInterval: 60 * 1000, // 1 minute
    retry: 3
  });
};
```

## Backend Specification

### Technology Stack
- **Python FastAPI** with async/await patterns
- **Zoho CRM API v8** with abstraction layer
- **SQLAlchemy** for data persistence
- **Pydantic** for data validation
- **Background Tasks** with asyncio
- **Health Monitoring** with comprehensive diagnostics

### Core Services

#### 1. **API Abstraction Layer**
```python
# app/services/zoho_api_client.py
class BaseZohoAPIClient(ABC):
    @abstractmethod
    async def get_deals(self, **kwargs) -> List[Dict[str, Any]]:
        """Get deals from CRM"""
        pass
    
    @abstractmethod
    async def update_deal(self, deal_id: str, data: Dict[str, Any]) -> bool:
        """Update a deal"""
        pass

class ZohoAPIClientV8(BaseZohoAPIClient):
    """Zoho CRM API v8 implementation"""
    pass

def create_zoho_client(api_version: str = "v8") -> BaseZohoAPIClient:
    """Factory function to create appropriate client"""
    pass
```

#### 2. **Enhanced Zoho Service**
```python
# app/services/enhanced_zoho_service.py
class EnhancedZohoService:
    def __init__(self, api_version: str = None):
        self.api_version = api_version or settings.ZOHO_API_VERSION
        self.client = create_zoho_client(self.api_version)
        self.pipeline_fields = self._get_pipeline_fields()
        self.o2r_milestone_fields = self._get_o2r_milestone_fields()
    
    async def get_all_deals(self) -> List[Dict[str, Any]]:
        """Fetch all deals with comprehensive field mapping"""
        pass
    
    async def validate_custom_fields(self) -> Dict[str, Any]:
        """Validate CRM field configuration"""
        pass
    
    def transform_zoho_deal_to_pipeline_deal(self, zoho_deal: Dict) -> Dict:
        """Transform CRM data to Pipeline Pulse format"""
        pass
```

#### 3. **Health Monitoring System**
```python
# app/services/zoho_health_monitor.py
class ZohoHealthMonitor:
    async def run_comprehensive_health_check(self) -> Dict[str, Any]:
        """Run 6-point health assessment"""
        health_checks = [
            await self._check_authentication(),
            await self._check_api_connectivity(), 
            await self._check_rate_limits(),
            await self._check_field_configuration(),
            await self._check_data_quality(),
            await self._check_webhook_status()
        ]
        return self._compile_health_report(health_checks)
```

#### 4. **Background Sync Service**
```python
# app/services/data_sync_service.py
class DataSyncService:
    async def start_scheduled_sync(self):
        """Start 15-minute background sync"""
        while True:
            await asyncio.sleep(15 * 60)
            await self.delta_sync()
    
    async def full_sync(self) -> Dict[str, Any]:
        """Complete CRM data synchronization"""
        pass
    
    async def delta_sync(self) -> Dict[str, Any]:
        """Incremental sync of modified deals"""
        pass
```

### API Endpoints

#### Live CRM Integration
```python
# Core endpoints for real-time CRM integration
GET /api/zoho/live-pipeline        # Live pipeline data with sync status
POST /api/zoho/sync               # Manual sync trigger
GET /api/zoho/status              # Current sync and connection status
POST /api/zoho/webhook            # Webhook endpoint for real-time updates
```

#### Health & Diagnostics
```python
# Comprehensive health monitoring endpoints
GET /api/zoho/health-check        # Full health assessment
GET /api/zoho/validate-setup      # CRM configuration validation
POST /api/zoho/test-connectivity  # API connectivity testing
GET /api/zoho/custom-fields       # Field configuration status
GET /api/zoho/health-trends       # Historical health analytics
```

#### O2R Integration
```python
# Opportunity-to-Revenue tracking endpoints
GET /api/o2r/opportunities        # O2R opportunities with health signals
POST /api/o2r/sync-to-crm/{id}   # Sync O2R changes to CRM
POST /api/o2r/sync-batch-to-crm   # Bulk CRM synchronization
GET /api/o2r/sync-status          # O2R sync status monitoring
```

### Data Models

#### Core Data Structures
```python
class LivePipelineData(BaseModel):
    deals: List[Deal]
    summary: PipelineSummary
    sync_status: SyncStatus
    data_freshness: datetime

class Deal(BaseModel):
    record_id: str
    opportunity_name: str
    account_name: str
    amount: float
    currency: str
    sgd_amount: float
    probability: int
    stage: str
    closing_date: Optional[date]
    territory: Optional[str]
    service_line: Optional[str]
    # O2R milestone fields
    proposal_date: Optional[date]
    po_date: Optional[date]
    kickoff_date: Optional[date]
    revenue_date: Optional[date]

class HealthCheck(BaseModel):
    name: str
    status: HealthStatus
    message: str
    details: Dict[str, Any]
    timestamp: datetime
```

### Required Custom Fields in Zoho CRM

#### Essential Fields for Pipeline Pulse
```json
{
  "required_fields": [
    {"name": "Territory", "type": "picklist", "values": ["APAC", "Americas", "EMEA", "India"]},
    {"name": "Service_Line", "type": "picklist", "values": ["MSP Services", "Gen AI", "Cloud Migration", "Security"]},
    {"name": "Strategic_Account", "type": "boolean"},
    {"name": "AWS_Funded", "type": "boolean"}
  ],
  "o2r_milestone_fields": [
    {"name": "Proposal_Date", "type": "date"},
    {"name": "PO_Date", "type": "date"},
    {"name": "Kickoff_Date", "type": "date"},
    {"name": "Invoice_Date", "type": "date"},
    {"name": "Payment_Date", "type": "date"},
    {"name": "Revenue_Date", "type": "date"}
  ]
}
```

### Configuration & Environment

#### Environment Variables
```bash
# Zoho CRM API v8 Configuration
ZOHO_API_VERSION=v8
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token

# Regional Configuration (adjust for data center)
ZOHO_BASE_URL=https://www.zohoapis.com/crm/v8
ZOHO_ACCOUNTS_URL=https://accounts.zoho.com

# Live Integration Settings
APP_BASE_URL=http://localhost:8000
WEBHOOK_TOKEN=your-secure-webhook-token

# Database & Performance
DATABASE_URL=sqlite:///./pipeline_pulse.db
RATE_LIMIT_CALLS_PER_MINUTE=100
```

## Development Guidelines

### Code Organization
```
backend/
├── app/
│   ├── services/
│   │   ├── zoho_api_client.py          # API abstraction layer
│   │   ├── enhanced_zoho_service.py    # Main CRM service
│   │   ├── zoho_health_monitor.py      # Health monitoring
│   │   └── data_sync_service.py        # Background sync
│   ├── api/endpoints/
│   │   ├── zoho.py                     # CRM endpoints
│   │   └── o2r/routes.py               # O2R endpoints
│   └── models/
│       ├── analysis.py                 # Pipeline data models
│       └── o2r/                        # O2R models

frontend/
├── src/
│   ├── hooks/
│   │   ├── useLivePipeline.ts          # Live data management
│   │   └── useConnectionHealth.ts      # Health monitoring
│   ├── components/
│   │   ├── ConnectionStatus.tsx        # CRM connection status
│   │   ├── LiveSyncIndicator.tsx       # Sync progress
│   │   └── HealthMonitor.tsx           # Health dashboard
│   └── pages/
│       ├── Dashboard.tsx               # Live dashboard
│       ├── CRMSync.tsx                 # Sync management
│       └── O2RTracker.tsx              # O2R tracking
```

### Key Principles
1. **Real-time First**: All data should reflect live CRM state
2. **Health Monitoring**: Comprehensive system health awareness
3. **Bidirectional Sync**: Changes flow both CRM → App → O2R
4. **Error Resilience**: Graceful handling of API failures
5. **Data Quality**: Automated validation and quality scoring
6. **Future Compatibility**: API abstraction for version flexibility

### Testing Strategy
1. **API Connectivity**: Validate all Zoho CRM endpoints
2. **Data Transformation**: Verify CRM → Pipeline Pulse format conversion
3. **Health Monitoring**: Test all health check scenarios
4. **Sync Operations**: Validate background and manual sync
5. **O2R Integration**: Test bidirectional CRM synchronization

This specification provides the foundation for a production-ready live CRM integration platform with comprehensive health monitoring, real-time data synchronization, and advanced revenue intelligence capabilities.