# Pipeline Pulse 🚀

**Pipeline Pulse** is a comprehensive revenue intelligence platform that transforms your Zoho CRM data into actionable insights through real-time integration. Built for revenue leaders who need live pipeline intelligence and data-driven decision making.

## ✨ Features

### 📊 **Live Pipeline Analytics**
- **Real-Time CRM Integration**: Direct connection to Zoho CRM API v8 for instant data updates
- **Currency Standardization**: Automatic SGD conversion using real exchange rates
- **Data Quality Intelligence**: Automated data completeness scoring and quality analysis
- **Interactive Drill-Down**: Country-by-country deal exploration with sortable views
- **Live Metrics**: Total pipeline value, deal counts, average sizes, and conversion rates

### 🔄 **Zoho CRM Integration (API v8)**
- **Live CRM Sync**: Real-time bidirectional synchronization with Zoho CRM
- **Background Sync**: Automated 15-minute interval sync with webhook support
- **Deal Updates**: Modify opportunities directly from the analysis interface
- **Webhook Integration**: Instant updates when CRM data changes
- **Health Monitoring**: Comprehensive connectivity and data quality monitoring

### 🎯 **O2R (Opportunity-to-Revenue) Tracking**
- **Milestone Management**: Track key opportunity milestones (Proposal, PO, Kickoff, Revenue)
- **Bidirectional CRM Sync**: O2R updates automatically sync back to Zoho CRM
- **Health Signals**: Automated opportunity health assessment (Green/Yellow/Red/Blocked)
- **Action Items**: AI-generated next steps and risk mitigation suggestions
- **Phase Tracking**: 4-phase opportunity progression monitoring

### 📈 **Advanced Filtering & Analytics**
- **Probability Ranges**: Focus on deals requiring active sales attention
- **Revenue Thresholds**: Filter out placeholder deals without actual values
- **Territory Analysis**: Geographic pipeline distribution and performance
- **Service Line Breakdown**: Pipeline analysis by business units
- **Date Range Analysis**: Closing date and milestone tracking

### 🎨 **Modern Interface**
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Pipeline Pulse Design System**: Custom UI components with business intelligence theming
- **Live Connection Status**: Real-time CRM connection and sync indicators
- **Command Palette**: Global search with Cmd/Ctrl+K shortcut
- **Navigation System**: 7 primary domains for comprehensive revenue intelligence

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **shadcn/ui** + **Pipeline Pulse Design System** for beautiful, accessible components
- **Tailwind CSS** with custom business intelligence tokens
- **React Query (@tanstack/react-query)** for live data fetching and caching
- **Recharts** for data visualization

### Backend
- **Python FastAPI** for high-performance async API
- **Zoho CRM API v8** with abstraction layer for future compatibility
- **Pandas** for data processing and analysis
- **Pydantic** for data validation
- **Background Tasks** with asyncio for scheduled sync
- **SQLite/PostgreSQL** for data persistence
- **Health Monitoring** with comprehensive diagnostics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- Zoho CRM account with API access
- npm/yarn/pnpm

### Installation

1. **Clone and setup the project**
```bash
cd /Users/jrkphani/Projects/pipeline_pulse

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt
```

2. **Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Zoho CRM credentials
```

**Required Environment Variables:**
```bash
# Zoho CRM Integration (v8)
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
ZOHO_REFRESH_TOKEN=your_zoho_refresh_token
ZOHO_API_VERSION=v8

# API Configuration (adjust for your data center)
ZOHO_BASE_URL=https://www.zohoapis.com/crm/v8
ZOHO_ACCOUNTS_URL=https://accounts.zoho.com

# Live CRM Integration
APP_BASE_URL=http://localhost:8000
WEBHOOK_TOKEN=your-secure-webhook-token

# Database
DATABASE_URL=sqlite:///./pipeline_pulse.db
```

3. **Zoho CRM Setup**
   - Visit https://api-console.zoho.com/
   - Create a new application
   - Generate client credentials and refresh token
   - Configure required custom fields (see `/api/zoho/field-requirements`)

4. **Run the application**
```bash
# Terminal 1: Backend
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/api/zoho/health-check

## 📁 Project Structure

```
pipeline-pulse/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # UI components + Pipeline Pulse design system
│   │   │   ├── navigation/  # Global navigation system
│   │   │   ├── ui/          # Enhanced UI components
│   │   │   └── o2r/         # O2R tracking components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks (live CRM integration)
│   │   ├── services/       # API integration
│   │   ├── contexts/       # React contexts (Navigation, Auth)
│   │   └── types/          # TypeScript definitions
│   └── package.json
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/   # API routes (Zoho CRM v8 integration)
│   │   │   └── o2r/         # O2R tracking API
│   │   ├── services/       # Business logic
│   │   │   ├── enhanced_zoho_service.py    # Main CRM service
│   │   │   ├── zoho_api_client.py          # API abstraction layer
│   │   │   ├── zoho_health_monitor.py      # Health monitoring
│   │   │   └── data_sync_service.py        # Background sync
│   │   ├── models/         # Data models
│   │   └── core/           # Core functionality
│   └── requirements.txt
└── README.md
```

## 🔗 API Endpoints

### Live CRM Integration
- `GET /api/zoho/live-pipeline` - Get live pipeline data with sync status
- `POST /api/zoho/sync` - Trigger manual CRM synchronization
- `GET /api/zoho/status` - Get current sync status and health
- `POST /api/zoho/webhook` - Webhook endpoint for real-time CRM updates

### Health Monitoring & Diagnostics
- `GET /api/zoho/health-check` - Comprehensive health assessment
- `GET /api/zoho/validate-setup` - Validate CRM configuration
- `POST /api/zoho/test-connectivity` - Test API connectivity
- `GET /api/zoho/custom-fields` - Check custom field configuration
- `GET /api/zoho/health-trends` - Historical health analytics

### O2R (Opportunity-to-Revenue) Tracking
- `GET /api/o2r/opportunities` - Get O2R opportunities with health signals
- `POST /api/o2r/sync-to-crm/{opportunity_id}` - Sync O2R changes to CRM
- `POST /api/o2r/sync-batch-to-crm` - Bulk sync to CRM
- `GET /api/o2r/sync-status` - O2R sync status monitoring

### Webhook Management
- `POST /api/zoho/webhook/setup` - Configure Zoho webhooks
- `GET /api/zoho/webhook/status` - Check webhook configuration
- `POST /api/zoho/webhook/test` - Test webhook endpoint

## 📊 Usage Workflow

1. **Setup Integration**: Configure Zoho CRM API v8 credentials and custom fields
2. **Health Check**: Verify connectivity using `/api/zoho/health-check`
3. **Initial Sync**: Trigger full synchronization with your CRM data
4. **Live Dashboard**: Monitor real-time pipeline metrics and connection status
5. **O2R Tracking**: Track opportunities through revenue realization milestones
6. **Bidirectional Updates**: Make changes in O2R that sync back to CRM
7. **Continuous Monitoring**: Background sync ensures data freshness

## 🔧 Configuration

### Required Custom Fields in Zoho CRM
The system requires specific custom fields in your Zoho CRM Deals module:

**Required Fields:**
- `Territory` (Picklist): APAC, Americas, EMEA, India
- `Service_Line` (Picklist): MSP Services, Gen AI, Cloud Migration, Security
- `Strategic_Account` (Boolean)
- `AWS_Funded` (Boolean)
- `Proposal_Date`, `PO_Date`, `Kickoff_Date`, `Invoice_Date`, `Payment_Date`, `Revenue_Date` (Date fields)

**Setup Validation:**
```bash
curl http://localhost:8000/api/zoho/validate-setup
```

### Regional Data Centers
Update environment variables for your Zoho data center:
- **US**: `https://www.zohoapis.com/crm/v8` (default)
- **India**: `https://www.zohoapis.in/crm/v8`
- **EU**: `https://www.zohoapis.eu/crm/v8`
- **Australia**: `https://www.zohoapis.com.au/crm/v8`

## 🔄 System Architecture

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

## 🏥 Health Monitoring

Pipeline Pulse includes comprehensive health monitoring:

- **Authentication Status**: Token validity and refresh management
- **API Connectivity**: Response times and error rates
- **Rate Limiting**: Usage tracking (100 calls/minute limit)
- **Field Configuration**: Custom field validation
- **Data Quality**: Completeness scoring and issue detection
- **Webhook Status**: Real-time notification configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, create an issue in the GitHub repository or refer to the comprehensive health monitoring endpoints for diagnostics.

---

**Pipeline Pulse** - Live CRM intelligence for modern revenue teams. Real-time data, actionable insights, bidirectional sync.