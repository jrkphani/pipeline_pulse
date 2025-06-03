# Pipeline Pulse 🚀

**Pipeline Pulse** is a comprehensive deal analysis platform that transforms your Zoho CRM data into actionable insights. Built for revenue leaders who need real-time pipeline intelligence and data-driven decision making.

🌐 **Live Production Application**: https://1chsalesreports.com

## ✨ Features

### 📊 **Smart Pipeline Analytics**
- **Currency Standardization**: Automatic SGD conversion using live exchange rates (CurrencyFreaks API)
- **Data Quality Filtering**: Focus on deals with actual revenue and active probabilities (10-89%)
- **Interactive Drill-Down**: Country-by-country deal exploration with sortable pivot tables
- **Real-Time Metrics**: Total pipeline value, deal counts, average sizes, and conversion rates
- **Account Manager Performance**: Detailed analytics by country and territory

### 🔄 **Zoho CRM Integration**
- **🚀 Direct Access Mode**: No authentication required - immediate application access
- **Live CRM Connection**: Direct API integration for real-time data sync
- **Bulk Updates**: Modify multiple opportunities simultaneously
- **O2R Tracking**: Opportunity-to-Revenue tracking with complete audit trails
- **Service Account Integration**: Secure CRM access via service credentials

### 📈 **Advanced Analytics**
- **Probability Ranges**: Focus on deals requiring active sales attention
- **Revenue Thresholds**: Filter out placeholder deals without actual values
- **Date Ranges**: Analyze specific time periods and closing windows
- **Geographic Analysis**: Country/region pipeline distribution with drill-down
- **Pivot Tables**: Interactive data exploration with subtotals and filtering

### 🎨 **Modern Interface**
- **Responsive Design**: Works seamlessly on desktop and mobile
- **shadcn/ui Components**: Beautiful, accessible interface components
- **Export Options**: Generate reports in multiple formats
- **Real-Time Updates**: Live data synchronization with visual indicators
- **File Management**: Upload history, duplicate detection, and CRUD operations

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **shadcn/ui** for beautiful, accessible components
- **Tailwind CSS** for styling
- **React Query** for data fetching and caching
- **Recharts** for data visualization
- **Playwright** for end-to-end testing

### Backend
- **Python FastAPI** for high-performance API
- **PostgreSQL** for production database
- **Pandas** for data processing and analysis
- **Pydantic** for data validation
- **Zoho CRM API** integration
- **Alembic** for database migrations

### Infrastructure (AWS)
- **ECS Fargate** for containerized backend deployment
- **Application Load Balancer** for traffic distribution
- **CloudFront CDN** for global frontend delivery
- **S3** for static website hosting
- **RDS PostgreSQL** for managed database
- **Route 53** for DNS management
- **Certificate Manager** for SSL certificates
- **AWS Secrets Manager** for secure credential storage

### Security & Compliance
- **✅ AWS Secrets Manager Integration**: Secure storage and automatic rotation of sensitive data
- **🚀 Direct Access Mode**: No authentication barriers - immediate application access
- **✅ Service Account Security**: Secure CRM integration via service credentials
- **✅ Environment-driven Configuration**: No hardcoded secrets in application code
- **✅ CORS Protection**: Environment-specific cross-origin resource sharing
- **✅ Input Validation**: Comprehensive data validation and sanitization
- **✅ SSL/TLS Encryption**: End-to-end encryption with wildcard certificates
- **✅ Zero Secret Exposure**: No sensitive data in logs, environment variables, or code
- **✅ Network Security**: HTTPS and infrastructure-level protection

## 🚀 Production Deployment

### Live Application
- **Frontend**: https://1chsalesreports.com
- **API**: https://api.1chsalesreports.com
- **Authentication**: Zoho Directory SAML SSO

### Architecture Overview
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │    │       ALB        │    │   ECS Fargate   │
│   (Global CDN)  │────│  (Load Balancer) │────│   (Backend)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                               │
         │                                               │
┌─────────────────┐                              ┌─────────────────┐
│       S3        │                              │  RDS PostgreSQL │
│   (Frontend)    │                              │   (Database)    │
└─────────────────┘                              └─────────────────┘
```

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL 13+
- Docker (optional)

### Installation

1. **Clone and setup the project**
```bash
git clone https://github.com/jrkphani/pipeline_pulse.git
cd pipeline-pulse

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt
```

2. **Database Setup**
```bash
# Setup local PostgreSQL
./scripts/setup-local-postgres.sh

# Run migrations
cd backend
alembic upgrade head
```

3. **Environment Configuration**
```bash
# Frontend (.env.local)
VITE_API_URL=http://localhost:8000
VITE_APP_NAME="Pipeline Pulse"

# Backend (.env.development)
DATABASE_URL=postgresql://pipeline_user:pipeline_pass@localhost:5432/pipeline_pulse_dev
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
CURRENCY_API_KEY=your_currencyfreaks_api_key
```

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

## 📁 Project Structure

```
pipeline-pulse/
├── frontend/                    # React TypeScript frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   ├── analysis/      # Analysis-specific components
│   │   │   ├── upload/        # File upload components
│   │   │   └── common/        # Common components
│   │   ├── pages/             # Application pages
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API integration
│   │   ├── types/             # TypeScript definitions
│   │   └── utils/             # Utility functions
│   ├── public/                # Static assets
│   ├── tests/                 # Playwright tests
│   └── package.json
├── backend/                     # Python FastAPI backend
│   ├── app/
│   │   ├── api/               # API routes and endpoints
│   │   │   ├── endpoints/     # Individual endpoint modules
│   │   │   └── routes.py      # Route configuration
│   │   ├── core/              # Core functionality
│   │   ├── models/            # SQLAlchemy models
│   │   ├── services/          # Business logic
│   │   │   ├── analysis/      # Analysis services
│   │   │   ├── zoho/          # Zoho CRM integration
│   │   │   └── currency/      # Currency conversion
│   │   └── utils/             # Utility functions
│   ├── alembic/               # Database migrations
│   ├── requirements.txt
│   └── main.py
├── infrastructure/             # AWS infrastructure
│   ├── cloudformation/        # CloudFormation templates
│   └── scripts/               # Deployment scripts
├── scripts/                    # Utility scripts
├── docs/                       # Documentation
└── tests/                      # End-to-end tests
```

## 🔗 API Endpoints

### File Management
- `POST /api/upload` - Upload CSV files for analysis
- `GET /api/files` - List uploaded files with metadata
- `GET /api/files/{file_id}/download` - Download original files
- `DELETE /api/files/{file_id}` - Delete files and associated data

### Analysis & Filtering
- `GET /api/analysis/{analysis_id}` - Retrieve analysis results
- `POST /api/analysis/{analysis_id}/filter` - Apply filters to analysis
- `GET /api/analysis/{analysis_id}/country/{country}` - Country drill-down data
- `GET /api/analysis/{analysis_id}/export` - Export filtered results

### Zoho CRM Integration
- `GET /api/zoho/auth/status` - Check authentication status
- `POST /api/zoho/auth/refresh` - Refresh access tokens
- `GET /api/zoho/opportunities` - Fetch opportunities from CRM
- `PUT /api/zoho/opportunities/{opportunity_id}` - Update single opportunity
- `POST /api/zoho/opportunities/bulk-update` - Bulk update opportunities
- `GET /api/zoho/users` - Get CRM users and territories

### O2R (Opportunity to Revenue) Tracking
- `GET /api/o2r/opportunities/{opportunity_id}` - Get O2R details
- `PUT /api/o2r/opportunities/{opportunity_id}` - Update O2R record
- `GET /api/o2r/sync-status` - Check sync status with CRM

### Currency & Exchange Rates
- `GET /api/currency/rates` - Get current exchange rates
- `POST /api/currency/refresh` - Refresh exchange rates from API
- `GET /api/currency/history` - Get historical rate data

## 📊 Usage Workflow

1. **Authentication**: Login via Zoho Directory SAML SSO
2. **Upload Data**: Import Zoho CRM opportunity export CSV files
3. **Review Analysis**: Explore automatically generated pipeline insights
4. **Apply Filters**: Focus on specific probability ranges, countries, or date ranges
5. **Drill Down**: Use pivot tables and country drill-down for detailed analysis
6. **Account Manager Analytics**: Analyze performance by territory and manager
7. **Bulk Updates**: Modify multiple opportunities simultaneously
8. **O2R Tracking**: Monitor opportunity-to-revenue conversion
9. **Export Results**: Generate reports for stakeholders and management

## 🔧 Configuration

### Zoho CRM Setup
1. **Server-based Application**: Create in Zoho Developer Console
2. **SAML Configuration**: Setup Zoho Directory custom application
3. **API Permissions**: Configure scopes for CRM data access
4. **Territory Management**: Leverage existing Zoho Directory roles

### Currency Exchange (CurrencyFreaks API)
- **Live Exchange Rates**: Weekly automatic updates
- **SGD Standardization**: All amounts converted to Singapore Dollars
- **Historical Data**: Rate history for consistent reporting
- **API Integration**: Secure key management via environment variables

### Environment Variables

#### Production (AWS Secrets Manager - Direct Access Mode)
```bash
# Core Configuration
ENVIRONMENT=production
AWS_REGION=ap-southeast-1
CORS_ORIGINS=https://1chsalesreports.com,https://www.1chsalesreports.com,https://api.1chsalesreports.com,https://app.1chsalesreports.com

# AWS Secrets Manager Secret Names (sensitive data stored securely)
DB_SECRET_NAME=pipeline-pulse/prod/database
ZOHO_SECRET_NAME=pipeline-pulse/prod/zoho
CURRENCY_SECRET_NAME=pipeline-pulse/prod/currency

# Note: JWT secrets removed - no authentication required
```

#### Local Development
```bash
# Local development uses direct environment variables
DATABASE_URL=postgresql://pipeline_user:pipeline_pass@localhost:5432/pipeline_pulse_dev
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
CURRENCY_API_KEY=your_currencyfreaks_api_key
JWT_SECRET=your_local_jwt_secret
```

## 🧪 Testing

### End-to-End Testing (Playwright)
```bash
# Run all tests
npm test

# Run specific test suites
npx playwright test tests/pipeline-pulse.spec.js
npx playwright test tests/quick-verification.spec.js

# Run tests in headed mode
npx playwright test --headed

# Generate test report
npx playwright show-report
```

### Backend Testing
```bash
cd backend
python -m pytest tests/
```

## 🚀 Deployment

### Production Deployment

#### AWS Secrets Manager Setup (Required First)
```bash
# Create production secrets in AWS Secrets Manager
./scripts/create-production-secrets.sh

# Verify secrets are created
aws secretsmanager list-secrets --region ap-southeast-1 --query 'SecretList[?contains(Name, `pipeline-pulse/prod`)]'
```

#### Application Deployment
```bash
# Deploy backend to ECS with Secrets Manager integration
./scripts/deploy-with-secrets.sh

# Deploy frontend to S3/CloudFront
cd frontend && npm run build
aws s3 sync dist/ s3://pipeline-pulse-frontend-prod --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E1234567890 --paths "/*"
```

### Infrastructure Management
- **ECS Fargate**: Auto-scaling containerized backend
- **CloudFront**: Global CDN with S3 origin for frontend
- **RDS PostgreSQL**: Managed database with automated backups
- **Application Load Balancer**: Health checks and traffic distribution

## 🔍 Monitoring & Logs

### CloudWatch Integration
- **Application Logs**: `/ecs/pipeline-pulse-prod`
- **Access Logs**: CloudFront and ALB access patterns
- **Performance Metrics**: Response times, error rates, throughput

### Health Checks
- **Backend Health**: `/health` endpoint with database connectivity
- **API Status**: `/api/zoho/auth/status` for CRM integration
- **Currency Service**: Live exchange rate validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, create an issue in the GitHub repository or contact the development team.

---

**Pipeline Pulse** - Transform your CRM data into revenue insights. Built for the modern sales organization.

🌐 **Live at**: https://1chsalesreports.com
