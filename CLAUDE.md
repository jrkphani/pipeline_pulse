# Pipeline Pulse - Enhanced CLAUDE.md

## 🎯 PROJECT CONTEXT

**Pipeline Pulse** is 1CloudHub's mission-critical **Opportunity-to-Revenue (O2R) tracking system**, a business intelligence platform that transforms Zoho CRM data into actionable revenue insights. As co-founder and innovator, this system directly impacts your revenue operations and strategic decision-making.

### 🌟 Strategic Importance
- **Business Impact**: Tracks 10+ mapped fields from Zoho CRM with 4-phase O2R progression
- **Revenue Intelligence**: Converts opportunities through Proposal → Commitment → Execution → Revenue
- **1CloudHub Innovation**: Reflects your vision for data-driven revenue optimization
- **Partnership Value**: Enables AWS co-sell tracking and alliance motion analysis

### 🚀 Current Production Status
- **Frontend**: https://1chsalesreports.com (S3 + CloudFront)
- **API**: https://api.1chsalesreports.com (Lambda + API Gateway)
- **Authentication**: Direct access mode + Zoho OAuth2 for CRM integration
- **Database**: AWS RDS PostgreSQL with IAM authentication

## 🔑 ZOHO CRM CONFIGURATION (CRITICAL)

### **Authentication Details**
```bash
# Environment Variables (MUST BE EXACT)
ZOHO_CLIENT_ID=1000.JKDZ5EYYE175QA1WGK5UVGM2R37KAY
ZOHO_CLIENT_SECRET=47b3ac5c29d2168b8d5c529fc2aa1f9c93da5c1be7

# Authorized Callback URIs
PRODUCTION_CALLBACK=https://api.1chsalesreports.com/api/zoho/auth/callback
LOCAL_CALLBACK=http://localhost:8000/api/zoho/auth/callback

# Homepage URL
ZOHO_HOMEPAGE=https://1chsalesreports.com

# Data Center Configuration
ZOHO_BASE_URL=https://www.zohoapis.in/crm/v8
ZOHO_ACCOUNTS_URL=https://accounts.zoho.in
```

### **API Endpoints Structure**
```python
# Authentication endpoints MUST match callback URIs
@router.get("/api/zoho/auth/callback")  # Production & Local
@router.get("/api/zoho/auth")           # Initiate OAuth
@router.post("/api/zoho/refresh")       # Token refresh
```

## 📋 MANDATORY ARCHITECTURE CONSTRAINTS

### 🔧 Backend (Python FastAPI + AWS Lambda)
- **Framework**: FastAPI 0.104.1+ with Python 3.9+
- **Runtime**: AWS Lambda with Python 3.9+ runtime
- **API Gateway**: AWS API Gateway v2 (HTTP API) for routing
- **Database**: AWS RDS PostgreSQL with IAM authentication
- **Dependencies**: Mangum for Lambda-FastAPI integration
- **Cold Start Optimization**: Proper Lambda configuration for performance
- **Structure**: Modular app/ directory with serverless-friendly patterns

**Critical Lambda Pattern:**
```python
# lambda_handler.py - Entry point for AWS Lambda
from mangum import Mangum
from app.main import app

# Configure Mangum for API Gateway integration
handler = Mangum(app, lifespan="off")

# Lambda environment configuration
import os
os.environ.setdefault("ENVIRONMENT", "production")
```

**FastAPI Lambda-Optimized Pattern:**
```python
# Required imports for Lambda-compatible endpoints
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db
from app.models.{model_name} import {ModelName}
from app.services.{service_name} import {ServiceName}
from app.schemas.{schema_name} import {SchemaName}

# Lambda-friendly database connection management
from app.core.database import get_lambda_db_session
```

### 🎨 Frontend (React + TypeScript + Shadcn/ui)

#### **MANDATORY UI Framework: Shadcn/ui**
- **Components**: shadcn/ui components EXCLUSIVELY (https://ui.shadcn.com/docs/components)
- **Sidebar**: Use Shadcn dashboard-01 sidebar (`npx shadcn@latest add dashboard-01`)
- **Login**: Use Shadcn login-02 with Zoho-only auth (`npx shadcn@latest add login-02`)
- **Charts**: Use Shadcn charts for all visualizations (https://ui.shadcn.com/charts/area)
- **Theme**: Custom design tokens (defined below)

#### **Required Theme Configuration**
```css
/* src/index.css - EXACT theme implementation */
:root {
  --radius: 0.65rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}
```

#### **Frontend Architecture Requirements**
- **Framework**: React 18+ with TypeScript (strict mode)
- **Build Tool**: Vite 4.5+ with hot reload
- **State Management**: 
  - **Client State**: Zustand for global application state
  - **Server State**: TanStack Query (React Query) for data fetching and caching
  - **URL State**: React Router for URL-accessible state
- **Styling**: Design tokens ONLY (no Tailwind arbitrary values)
- **Routing**: React Router v6 with proper error boundaries and data loaders

## 🏗️ STATE MANAGEMENT ARCHITECTURE

### **Zustand for Client State**
```typescript
// Example store in /src/stores/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: async () => {
        // Clear auth state
        set({ user: null, isAuthenticated: false });
        // Clear TanStack Query cache
        queryClient.clear();
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### **TanStack Query for Server State**
```typescript
// Configure QueryClient in /src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Example query hook in /src/features/opportunities/api/useOpportunities.ts
import { useQuery } from '@tanstack/react-query';
import { opportunitiesApi } from '../api/opportunitiesApi';

export const useOpportunities = (filters = {}) => {
  return useQuery({
    queryKey: ['opportunities', filters],
    queryFn: () => opportunitiesApi.getOpportunities(filters),
    // Additional options like select, onSuccess, etc.
  });
};

// Example mutation hook
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useUpdateOpportunity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (updatedData) => opportunitiesApi.updateOpportunity(updatedData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      // Update single opportunity in cache
      queryClient.setQueryData(['opportunity', variables.id], data);
    },
  });
};
```

### **Integration with Components**
```tsx
// Example component using both Zustand and TanStack Query
import { useOpportunities } from '@/features/opportunities/api/useOpportunities';
import { useAuthStore } from '@/stores/useAuthStore';

const OpportunitiesList = () => {
  const { user } = useAuthStore();
  const { data: opportunities, isLoading, error } = useOpportunities();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading opportunities</div>;
  
  return (
    <div>
      <h2>Welcome, {user?.name}</h2>
      {opportunities?.map((opp) => (
        <OpportunityCard key={opp.id} opportunity={opp} />
      ))}
    </div>
  );
};
```

**Critical Pattern:**
```tsx
// Required imports for all new components
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useStore } from '@/stores/useStore'; // Example Zustand store
```

### ☁️ Infrastructure (AWS Serverless)
- **Frontend**: S3 + CloudFront with Route 53 DNS
- **Backend**: AWS Lambda + API Gateway v2 (HTTP API)
- **Database**: RDS PostgreSQL with IAM authentication
- **Secrets**: AWS Secrets Manager for credentials
- **Security**: SSL/TLS via AWS Certificate Manager
- **Monitoring**: CloudWatch Logs + X-Ray tracing
- **Deployment**: AWS SAM or CDK for infrastructure as code

## 🚀 PERFORMANCE OPTIMIZATIONS

### **React Query Optimizations**
- **Stale-While-Revalidate**: Built-in caching strategy for optimal performance
- **Request Deduplication**: Automatic deduplication of simultaneous requests
- **Background Refetching**: Data refreshes in the background when stale
- **Pagination/Infinite Query**: Built-in support for paginated data
- **Optimistic Updates**: Smooth UI updates with rollback on error

### **Zustand Optimizations**
- **Selective Re-renders**: Components only re-render when their selected state changes
- **Immer Integration**: Simplified immutable updates with mutable syntax
- **Middleware Support**: Persist, devtools, and more
- **Shallow Equality**: Automatic shallow comparison for arrays/objects

## 🔄 DEVELOPMENT COMMANDS

### Backend Development (Lambda-Optimized)
```bash
# Setup and run backend locally
cd backend
pip install -r requirements.txt

# Install Lambda development dependencies
pip install mangum uvicorn[standard]

# Local development with Lambda simulation
uvicorn lambda_handler:handler --reload --port 8000

# Alternative: Use SAM for local Lambda testing
sam local start-api --port 8000

# Database operations
alembic upgrade head                    # Apply migrations
alembic revision --autogenerate -m "description"  # Create migration
python reset_database.py               # Reset local database

# Testing (Lambda-compatible)
python -m pytest                       # Run all tests
python -m pytest -v test_lambda_integration.py  # Lambda-specific tests
python -m pytest --asyncio-mode=auto   # Async tests
```

### Frontend Development
```bash
# Setup and run frontend
cd frontend
npm install

# Add required Shadcn components
npx shadcn@latest add dashboard-01      # Sidebar layout
npx shadcn@latest add login-02          # Login components
npx shadcn@latest add chart            # Chart components

npm run dev                            # Start on port 5173

# Build and test
npm run build                          # TypeScript check + build
npm run lint                           # ESLint validation
npm run preview                        # Preview production build

# E2E Testing
npm test                               # All Playwright tests
npm run test:quick                     # Quick verification
npm run test:aws                       # Production tests
npx playwright test --headed           # With browser UI
```

### Lambda Deployment Commands
```bash
# Build Lambda deployment package
cd backend
pip install -r requirements.txt -t ./package
cp -r app/ package/
cp lambda_handler.py package/

# Create deployment zip
cd package && zip -r ../deployment.zip . && cd ..

# Deploy using AWS CLI
aws lambda update-function-code \
  --function-name pipeline-pulse-api \
  --zip-file fileb://deployment.zip

# Deploy using SAM
sam build
sam deploy --guided

# Deploy using CDK
cdk deploy PipelinePulseStack
```

## 🏗️ LAMBDA-SPECIFIC ARCHITECTURE

### 🔧 Lambda Function Structure

**Entry Point Configuration:**
```python
# lambda_handler.py
import os
from mangum import Mangum
from app.main import app

# Configure for Lambda environment
os.environ.setdefault("AWS_LAMBDA_FUNCTION_NAME", "pipeline-pulse-api")
os.environ.setdefault("ENVIRONMENT", "production")

# Lambda handler with optimized configuration
handler = Mangum(
    app,
    lifespan="off",  # Disable lifespan for Lambda
    api_gateway_base_path="/api",  # Match your API Gateway stage
    text_mime_types=[
        "application/json",
        "application/javascript",
        "application/xml",
        "application/vnd.api+json",
    ]
)
```

**Lambda-Optimized Database Connections:**
```python
# app/core/lambda_database.py
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
import os

# Lambda-optimized database configuration
def create_lambda_engine():
    database_url = os.getenv("DATABASE_URL")
    
    # Optimize for Lambda cold starts
    engine = create_engine(
        database_url,
        poolclass=NullPool,  # No connection pooling in Lambda
        pool_pre_ping=True,  # Validate connections
        pool_recycle=300,    # Recycle connections every 5 minutes
        connect_args={
            "connect_timeout": 10,
            "application_name": "pipeline-pulse-lambda"
        }
    )
    
    return engine

# Lambda-specific session management
lambda_engine = create_lambda_engine()
LambdaSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=lambda_engine)

def get_lambda_db():
    """Lambda-optimized database session"""
    db = LambdaSessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**Lambda Environment Variables:**
```python
# Required Lambda environment variables
LAMBDA_ENV_VARS = {
    "ZOHO_CLIENT_ID": "1000.JKDZ5EYYE175QA1WGK5UVGM2R37KAY",
    "ZOHO_CLIENT_SECRET": "47b3ac5c29d2168b8d5c529fc2aa1f9c93da5c1be7",
    "DATABASE_URL": "postgresql://username:password@rds-endpoint:5432/pipeline_pulse",
    "CURRENCYFREAKS_API_KEY": "stored-in-secrets-manager",
    "AWS_REGION": "us-east-1",
    "ENVIRONMENT": "production"
}
```

### 🚀 API Gateway Configuration

**HTTP API v2 Setup:**
```yaml
# template.yaml (SAM template)
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  PipelinePulseAPI:
    Type: AWS::Serverless::HttpApi
    Properties:
      StageName: api
      Domain:
        DomainName: api.1chsalesreports.com
        CertificateArn: !Ref SSLCertificate
      CorsConfiguration:
        AllowOrigins:
          - "https://1chsalesreports.com"
          - "http://localhost:5173"
        AllowHeaders:
          - "*"
        AllowMethods:
          - "*"
        MaxAge: 600

  PipelinePulseFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: pipeline-pulse-api
      CodeUri: package/
      Handler: lambda_handler.handler
      Runtime: python3.9
      Timeout: 30
      MemorySize: 512
      Environment:
        Variables:
          ENVIRONMENT: production
      Events:
        ApiEvent:
          Type: HttpApi
          Properties:
            ApiId: !Ref PipelinePulseAPI
            Path: /{proxy+}
            Method: ANY
```

### 🔄 Lambda Optimization Patterns

**Cold Start Optimization:**
```python
# app/core/lambda_optimizations.py
import json
import logging
from functools import lru_cache
from typing import Dict, Any

# Global connections (outside handler)
db_engine = None
logger = logging.getLogger()

@lru_cache(maxsize=1)
def get_cached_config() -> Dict[str, Any]:
    """Cache configuration to reduce cold start time"""
    return {
        "zoho_client_id": os.getenv("ZOHO_CLIENT_ID"),
        "zoho_client_secret": os.getenv("ZOHO_CLIENT_SECRET"),
        "database_url": os.getenv("DATABASE_URL")
    }

def lambda_warmup_handler(event: Dict, context: Any) -> Dict:
    """Handle Lambda warmup events"""
    if event.get("source") == "aws.events" and event.get("detail-type") == "Scheduled Event":
        return {"statusCode": 200, "body": "Warmup successful"}
    
    # Regular request handling
    return handler(event, context)

# Connection reuse pattern
def get_or_create_db_connection():
    global db_engine
    if db_engine is None:
        db_engine = create_lambda_engine()
    return db_engine
```

**Background Task Handling:**
```python
# app/services/lambda_background_tasks.py
import boto3
from typing import Dict, Any

class LambdaBackgroundTasks:
    """Handle background tasks in Lambda environment"""
    
    def __init__(self):
        self.lambda_client = boto3.client('lambda')
        self.sqs_client = boto3.client('sqs')
    
    async def queue_crm_sync(self, batch_id: str) -> None:
        """Queue CRM sync as separate Lambda invocation"""
        payload = {
            "action": "crm_sync",
            "batch_id": batch_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Async Lambda invocation
        self.lambda_client.invoke(
            FunctionName='pipeline-pulse-background-worker',
            InvocationType='Event',  # Async
            Payload=json.dumps(payload)
        )
    
    async def schedule_data_refresh(self, delay_seconds: int = 300) -> None:
        """Schedule data refresh using SQS delay"""
        queue_url = os.getenv("BACKGROUND_TASKS_QUEUE_URL")
        
        self.sqs_client.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps({"action": "data_refresh"}),
            DelaySeconds=delay_seconds
        )
```

## 🎨 DESIGN SYSTEM COMPLIANCE

### ✅ UI Component Requirements

#### **Shadcn/ui Components ONLY**
```tsx
// ✅ CORRECT - Use Shadcn components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ❌ FORBIDDEN - No other UI libraries
import { Button } from '@mui/material';  // NO Material-UI
import { Button } from 'antd';           // NO Ant Design
import { Button } from '@chakra-ui/react'; // NO Chakra UI
```

#### **Required Sidebar Implementation**
```tsx
// App layout with Shadcn sidebar
import { SidebarProvider, Sidebar, SidebarContent, SidebarInset } from '@/components/ui/sidebar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarContent>
            {/* Navigation items */}
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="flex-1">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
```

#### **Chart Implementation Requirements**
```tsx
// Use Shadcn charts for all visualizations
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

// Custom chart configuration using design tokens
const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  opportunities: {
    label: "Opportunities", 
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;
```

### ✅ Layout Compliance

#### **Responsive Design**
- [ ] Uses mobile-first responsive breakpoints
- [ ] Uses `sm:`, `md:`, `lg:`, `xl:` prefixes appropriately
- [ ] Tests on mobile, tablet, and desktop viewports
- [ ] No horizontal scrolling on mobile

#### **Container Patterns**
```tsx
// ✅ CORRECT responsive container
<div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
    {/* Content */}
  </div>
</div>

// ❌ FORBIDDEN - Fixed widths
<div style={{ width: '1200px' }}>
```

#### **Navigation**
- [ ] Uses consistent navigation patterns
- [ ] Implements proper breadcrumbs
- [ ] Uses accessible navigation landmarks

### ✅ Accessibility Compliance

#### **ARIA Labels**
```tsx
// ✅ CORRECT accessibility implementation
<Button
  aria-label="Update opportunity phase"
  aria-describedby="phase-help-text"
>
  Update Phase
</Button>

<div id="phase-help-text" className="sr-only">
  This will update the opportunity to the next phase
</div>
```

#### **Keyboard Navigation**
- [ ] All interactive elements are keyboard accessible
- [ ] Proper tab order implementation
- [ ] Focus indicators visible

#### **Color Contrast**
- [ ] Text meets WCAG 2.1 AA contrast requirements
- [ ] Interactive elements have sufficient contrast
- [ ] No color-only information conveyance

### ✅ Performance Compliance

#### **Bundle Size**
```tsx
// ✅ CORRECT - Tree-shaking friendly imports
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

// ❌ FORBIDDEN - Barrel imports
import * as Utils from '@/lib/utils';
```

#### **Code Splitting**
```tsx
// ✅ CORRECT - Lazy load heavy components
const LazyDataTable = lazy(() => import('@/components/ui/data-table'));
const LazyChartDashboard = lazy(() => import('@/components/charts/dashboard'));
```

### ✅ Code Quality Compliance

#### **TypeScript Requirements**
```tsx
// ✅ CORRECT - Fully typed components
interface OpportunityCardProps {
  opportunity: Opportunity;
  onUpdate?: (updated: Opportunity) => void;
  className?: string;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  onUpdate,
  className
}) => {
  // Implementation
};

// ❌ FORBIDDEN - Any types
const OpportunityCard = (props: any) => {
```

#### **Error Handling**
```tsx
// ✅ CORRECT - Proper error boundaries
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle className="text-destructive">Something went wrong</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <Button onClick={resetErrorBoundary}>Try again</Button>
      </CardContent>
    </Card>
  );
}
```

## 🏗️ ARCHITECTURE OVERVIEW

### 🎯 Core Business Logic

**O2R Tracker (Opportunity-to-Revenue)**
- **Phase I**: Opportunity → Proposal (Deal qualification, proposal sent/accepted)
- **Phase II**: Proposal → Commitment (SOW initiated/approved, PO received)
- **Phase III**: Execution (Kickoff, milestones, execution started)
- **Phase IV**: Revenue Realization (Customer signoff, invoice, payment, revenue recognized)

**Health Signal Algorithm:**
```python
# 🟢 Green: On track (no delays)
# 🟡 Yellow: At risk (minor delays)
# 🔴 Red: Critical (major delays or stalled)
```

### 🔌 Integration Points

**1. Zoho CRM Integration (Lambda-Optimized)**
- OAuth2 authentication with automatic token refresh
- Bulk update operations (max 100 records per API call)
- Field mapping for 10+ custom fields
- Real-time sync status tracking via SQS/Lambda

**2. Currency Conversion System**
- SGD standardization using CurrencyFreaks API
- 7-day rate caching with fallback mechanisms
- Historical rate storage for consistent reporting

**3. AWS Alliance Tracking**
- AWS segment mapping (Startup/Scale/Focus/Deep)
- Funding program tracking (MAP, POC Credits)
- Co-sell opportunity identification

## 📊 CRITICAL BUSINESS REQUIREMENTS

### 🎯 Data Model Compliance
**Must implement these 10 mapped fields from Zoho CRM:**
1. **Territory/Region** (`Business Region`)
2. **Service Line** (`Solution Type`)
3. **AWS Funded Tag** (`Type of Funding`)
4. **Alliance Motion** (`Market Segment`)
5. **Proposal Sent Date** (`Proposal Submission date`)
6. **PO Received Date** (`PO Generation Date`)
7. **Kickoff Date** (`Kick-off Date`)
8. **Invoice Date** (`Invoice Date`)
9. **Payment Received** (`Received On`)
10. **Revenue Recognition** (`OB Recognition Date`)

### 🔄 Phase Progression Logic
```typescript
interface O2RPhaseProgress {
  phase1: {
    qualified: { date: string, status: 'completed' | 'pending' | 'delayed' }
    proposalSent: { date: string, status: PhaseStatus }
    proposalAccepted: { date: string, status: PhaseStatus }
  }
  // ... similar for phase2, phase3, phase4
}
```

### 📈 Performance Requirements
- Handle 1000+ opportunity records efficiently
- Sub-second Lambda response times (< 500ms)
- Real-time data synchronization with CRM
- Background processing for bulk operations via async Lambda

## 🚫 STRICT PROHIBITIONS

### ❌ Technology Stack Violations
- **NO** other UI libraries (Material-UI, Ant Design, Chakra, etc.)
- **NO** other CSS frameworks (Bootstrap, Bulma, etc.)
- **NO** custom CSS files (use design tokens only)
- **NO** class components (functional components only)
- **NO** other state management (Redux, Valtio)
- **NO** hardcoded values (use environment variables)
- **NO** Tailwind arbitrary values (use design tokens)
- **NO** ECS or container-based deployments (use Lambda only)

### ❌ Code Quality Issues
- **NO** TODO comments without GitHub issues
- **NO** console.log in production code
- **NO** missing error handling
- **NO** untyped functions/components
- **NO** SQL injection vulnerabilities
- **NO** missing input validation
- **NO** any types in TypeScript

### ❌ Data Handling Violations
- **NO** client-side data mutations without server sync
- **NO** localStorage for sensitive data
- **NO** direct database queries from frontend
- **NO** missing audit trails for data changes
- **NO** Lambda connection pooling (use NullPool)

## ✅ REQUIRED IMPLEMENTATION PATTERNS

### 🔧 Lambda Implementation Pattern
```python
# Standard Lambda-optimized FastAPI endpoint
from mangum import Mangum
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.lambda_database import get_lambda_db

router = APIRouter()

@router.post("/opportunities/{opportunity_id}/update-phase")
async def update_opportunity_phase(
    opportunity_id: str,
    phase_data: PhaseUpdateRequest,
    db: Session = Depends(get_lambda_db)
) -> StandardResponse:
    try:
        # Validate phase transition
        opportunity = await get_opportunity_by_id(opportunity_id, db)
        if not opportunity:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        
        # Update phase with business logic
        updated_opportunity = await update_phase_with_validation(
            opportunity, phase_data, db
        )
        
        # Queue background sync via async Lambda invocation
        background_tasks = LambdaBackgroundTasks()
        await background_tasks.queue_crm_sync(opportunity_id)
        
        return StandardResponse(
            status="success",
            data=updated_opportunity,
            message="Phase updated successfully"
        )
    except Exception as e:
        logger.error(f"Phase update failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
```

### 🎨 Frontend Implementation Pattern
```tsx
// Standard React component with Shadcn components
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onUpdate?: (updated: Opportunity) => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  onUpdate
}) => {
  const { toast } = useToast();
  
  const { mutate: updatePhase, isPending } = useMutation({
    mutationFn: (phaseData: PhaseUpdateData) => 
      api.updateOpportunityPhase(opportunity.id, phaseData),
    onSuccess: (updated) => {
      toast({
        title: "Phase Updated",
        description: "Opportunity phase updated successfully"
      });
      onUpdate?.(updated);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle>{opportunity.name}</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={getPhaseVariant(opportunity.currentPhase)}>
            {opportunity.currentPhase}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={() => updatePhase(nextPhaseData)}
          disabled={isPending}
          className="w-full"
        >
          {isPending ? "Updating..." : "Update Phase"}
        </Button>
      </CardContent>
    </Card>
  );
};
```

## 🔄 ZOHO CRM INTEGRATION PATTERNS

### 🔐 Authentication Flow (Lambda-Optimized)
```python
# Lambda-optimized OAuth2 token management
class ZohoAuthService:
    def __init__(self):
        self.client_id = "1000.JKDZ5EYYE175QA1WGK5UVGM2R37KAY"
        self.client_secret = "47b3ac5c29d2168b8d5c529fc2aa1f9c93da5c1be7"
        self.redirect_urls = {
            "production": "https://api.1chsalesreports.com/api/zoho/auth/callback",
            "development": "http://localhost:8000/api/zoho/auth/callback"
        }
        # Cache tokens in memory for Lambda container reuse
        self._cached_token = None
        self._token_expiry = None
    
    async def get_access_token(self) -> str:
        """Get valid access token with Lambda-optimized caching"""
        
    async def refresh_token(self) -> bool:
        """Refresh expired token with error handling"""
        
    async def handle_auth_callback(self, code: str) -> Dict[str, Any]:
        """Handle OAuth callback with Lambda context"""
```

### 📊 Data Synchronization (Async Lambda)
```python
# Lambda background tasks for bulk operations
class ZohoBulkUpdateService:
    def __init__(self):
        self.lambda_client = boto3.client('lambda')
    
    async def bulk_update_opportunities(
        self, 
        updates: List[OpportunityUpdate]
    ) -> BulkUpdateResult:
        """Update multiple opportunities with async Lambda processing"""
        
        # Process in smaller batches for Lambda timeout limits
        batch_size = 50  # Optimized for Lambda 30-second timeout
        results = []
        
        for i in range(0, len(updates), batch_size):
            batch = updates[i:i + batch_size]
            
            # Invoke background Lambda for processing
            payload = {
                "action": "bulk_update_batch",
                "updates": batch,
                "batch_number": i // batch_size
            }
            
            response = self.lambda_client.invoke(
                FunctionName='pipeline-pulse-background-worker',
                InvocationType='Event',  # Async
                Payload=json.dumps(payload)
            )
            
            results.append(response)
        
        return BulkUpdateResult(batch_count=len(results))
    
    async def sync_o2r_milestones(
        self, 
        opportunity_id: str, 
        milestones: Dict[str, Any]
    ) -> bool:
        """Sync O2R milestone data with async processing"""
```

## 🔍 Review Checklist

### Before Code Review
- [ ] Run `npm run type-check` - no TypeScript errors
- [ ] Run `npm run lint` - no linting errors
- [ ] Test responsive design on multiple screen sizes
- [ ] Verify color contrast ratios
- [ ] Test keyboard navigation
- [ ] Ensure Shadcn components used exclusively
- [ ] Verify design tokens usage (no arbitrary values)
- [ ] Test Lambda function locally with SAM
- [ ] Verify Lambda timeout and memory settings

### During Code Review
- [ ] Check for hardcoded colors or spacing
- [ ] Verify proper Shadcn component usage
- [ ] Ensure consistent patterns with existing code
- [ ] Review accessibility implementation
- [ ] Check for performance implications
- [ ] Verify Zoho integration follows exact configuration
- [ ] Ensure TypeScript strict compliance
- [ ] Verify Lambda-optimized patterns (no connection pooling)
- [ ] Check for proper error handling in serverless context

## 🎯 FEATURE-SPECIFIC GUIDELINES

### 🔄 Bulk Update Implementation (Lambda)
- **Frontend**: Multi-select interface with field validation using Shadcn components
- **Backend**: Async Lambda processing with SQS queuing
- **CRM Integration**: Batch API calls with retry logic via separate Lambda functions
- **Error Handling**: Partial success handling with detailed error tracking

### 📊 Dashboard Components (Serverless)
- **Real-time Updates**: Scheduled Lambda functions for data refresh
- **Filtering**: Territory, service line, AWS segment, date ranges
- **Health Signals**: Color-coded status indicators using design tokens
- **Export**: CSV/Excel export via Lambda functions with S3 temporary storage
- **Charts**: Use Shadcn chart components exclusively

### 🎯 O2R Tracker Features (Lambda-Optimized)
- **Phase Visualization**: Progress bars and milestone tracking
- **Health Monitoring**: Automated delay detection via scheduled Lambda
- **CRM Sync**: Bidirectional sync via async Lambda invocations
- **Reporting**: Executive dashboards with cached data for performance

## 📚 IMPLEMENTATION CHECKLIST

### 🔧 Before Any Feature Development
- [ ] Review existing Shadcn component patterns
- [ ] Design TypeScript interfaces for all data structures
- [ ] Plan Lambda function architecture (sync vs async)
- [ ] Consider CRM integration requirements with exact credentials
- [ ] Plan error handling for serverless environment
- [ ] Ensure accessibility compliance from start

### 🔄 During Implementation
- [ ] Follow established Shadcn component patterns
- [ ] Implement Lambda-optimized database connections
- [ ] Add comprehensive error handling for serverless context
- [ ] Include CloudWatch logging for debugging
- [ ] Write unit tests for Lambda functions
- [ ] Test CRM integration with staging environment
- [ ] Use design tokens exclusively (no arbitrary values)
- [ ] Optimize for Lambda cold starts

### ✅ Before Deployment
- [ ] Verify all TypeScript types are correct (no any types)
- [ ] Test Lambda functions with production-like data volumes
- [ ] Validate CRM integration with real Zoho account using exact credentials
- [ ] Ensure proper AWS permissions for Lambda + RDS + Secrets Manager
- [ ] Run full E2E test suite against Lambda endpoints
- [ ] Review Lambda timeout and memory configurations
- [ ] Test responsive design on all breakpoints
- [ ] Verify accessibility compliance
- [ ] Test Lambda cold start performance

## 🚀 ADVANCED FEATURES TO CONSIDER

### 🤖 AI-Powered Insights (Serverless)
- **Revenue Forecasting**: ML models via SageMaker + Lambda integration
- **Health Scoring**: Advanced algorithms in dedicated Lambda functions
- **Recommendation Engine**: Event-driven recommendations via Lambda + EventBridge

### 📊 Advanced Analytics (Lambda + S3)
- **Cohort Analysis**: Batch processing via scheduled Lambda functions
- **Performance Benchmarking**: Real-time calculations with Lambda + DynamoDB
- **Predictive Analytics**: Event-driven analysis with Lambda + Kinesis

### 🔄 Enhanced Integrations (Event-Driven)
- **AWS Partner Central**: Direct co-sell sync via Lambda + API Gateway
- **Marketing Automation**: Event-driven integration via Lambda + SNS
- **Financial Systems**: Real-time revenue recognition via Lambda webhooks

## 🎯 SUCCESS METRICS

### 📈 Key Performance Indicators
- **Lambda Performance**: < 500ms response time, < 2% cold start rate
- **Conversion Rates**: Stage-to-stage progression rates
- **Health Signal Accuracy**: Prediction vs. actual outcomes
- **CRM Sync Reliability**: Data consistency and sync success rates

### 💰 Business Impact
- **Cost Optimization**: 60% reduction in infrastructure costs vs ECS
- **Operational Efficiency**: Reduced manual data entry and reporting
- **Strategic Insights**: Better decision-making through data visibility
- **AWS Partnership Value**: Increased co-sell success rates

---

## 🔮 FUTURE VISION: Serverless-First Architecture

### 🚀 Planned Evolution
The system is designed as a **serverless-first architecture**:

1. **Event-Driven Processing**: Lambda functions triggered by CRM changes
2. **Auto-Scaling**: Automatic scaling based on demand
3. **Cost Optimization**: Pay-per-request pricing model
4. **Enhanced Reliability**: Multi-AZ Lambda deployment
5. **Advanced Analytics**: Real-time stream processing with Kinesis + Lambda

### 🎯 Implementation Roadmap
- **Phase 1**: Migrate from ECS to Lambda + API Gateway
- **Phase 2**: Implement event-driven CRM synchronization
- **Phase 3**: Add real-time analytics with Lambda + DynamoDB Streams
- **Phase 4**: ML-powered insights via SageMaker + Lambda

This serverless architecture aligns with modern cloud-native principles, providing cost efficiency, automatic scaling, and improved reliability for 1CloudHub's revenue intelligence platform.

## 🔧 CLAUDE COMMANDS AVAILABLE

The following custom commands are available to assist with development:

- `/setup-environment [component]` - Set up development environment
- `/quality-check [component]` - Run comprehensive quality validation
- `/deploy-production [environment]` - Deploy to AWS Lambda + API Gateway
- `/build-o2r-feature [component]` - Build O2R tracking features
- `/implement-bulk-update [component]` - Create bulk update system
- `/debug-zoho-integration [issue_type]` - Debug CRM integration issues

Use these commands to accelerate development and maintain code quality throughout the project lifecycle.