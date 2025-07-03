# Build O2R Feature

Build comprehensive O2R (Opportunity-to-Revenue) feature: $ARGUMENTS

## 🎯 O2R Feature Overview

The O2R Tracker implements 1CloudHub's strategic revenue framework with 4-phase progression:

- **Phase I**: Opportunity → Proposal (Deal qualification, proposal sent/accepted)  
- **Phase II**: Proposal → Commitment (SOW initiated/approved, PO received)
- **Phase III**: Execution (Kickoff, milestones, execution started)
- **Phase IV**: Revenue Realization (Customer signoff, invoice, payment, revenue recognized)

## 📊 Required Data Model Implementation

### Backend Models (SQLAlchemy)

```python
# app/models/o2r.py
from sqlalchemy import Column, String, DateTime, Float, Integer, Text, Boolean, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime

class O2ROpportunity(Base):
    __tablename__ = "o2r_opportunities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    zoho_deal_id = Column(String(50), nullable=False, unique=True)
    
    # Basic opportunity info
    name = Column(String(255), nullable=False)
    account_name = Column(String(255), nullable=False)
    amount_sgd = Column(Float, nullable=False)
    probability = Column(Integer, nullable=False)
    closing_date = Column(DateTime)
    
    # O2R Business Fields (from Zoho CRM mapping)
    territory = Column(String(100))  # Business Region
    service_line = Column(String(100))  # Solution Type  
    aws_funded_tag = Column(String(100))  # Type of Funding
    alliance_motion = Column(String(100))  # Market Segment
    strategic_account = Column(Boolean, default=False)
    
    # Phase Milestones
    proposal_date = Column(DateTime)  # Proposal Submission date
    sow_date = Column(DateTime)  # Estimated from stage progression
    po_date = Column(DateTime)  # PO Generation Date
    kickoff_date = Column(DateTime)  # Kick-off Date
    invoice_date = Column(DateTime)  # Invoice Date
    payment_date = Column(DateTime)  # Received On
    revenue_date = Column(DateTime)  # OB Recognition Date
    
    # Calculated fields
    current_phase = Column(String(20), nullable=False, default='phase1')
    health_signal = Column(String(10), nullable=False, default='green')
    days_in_phase = Column(Integer, default=0)
    
    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_sync_at = Column(DateTime)
    
    # Relationships
    milestones = relationship("O2RMilestone", back_populates="opportunity")
    activities = relationship("O2RActivity", back_populates="opportunity")

class O2RMilestone(Base):
    __tablename__ = "o2r_milestones"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    opportunity_id = Column(UUID(as_uuid=True), ForeignKey("o2r_opportunities.id"))
    
    phase = Column(String(20), nullable=False)  # phase1, phase2, phase3, phase4
    milestone_name = Column(String(100), nullable=False)
    target_date = Column(DateTime)
    completed_date = Column(DateTime)
    status = Column(String(20), default='pending')  # pending, completed, delayed, blocked
    
    opportunity = relationship("O2ROpportunity", back_populates="milestones")

class O2RActivity(Base):
    __tablename__ = "o2r_activities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    opportunity_id = Column(UUID(as_uuid=True), ForeignKey("o2r_opportunities.id"))
    
    activity_type = Column(String(50), nullable=False)
    description = Column(Text)
    scheduled_date = Column(DateTime)
    completed_date = Column(DateTime)
    outcome = Column(String(20))  # successful, failed, rescheduled
    
    opportunity = relationship("O2ROpportunity", back_populates="activities")
```

### Frontend Types (TypeScript)

```typescript
// src/types/o2r.ts
export interface O2ROpportunity {
  id: string;
  zoho_deal_id: string;
  
  // Basic info
  name: string;
  account_name: string;
  amount_sgd: number;
  probability: number;
  closing_date: string;
  
  // Business fields
  territory?: string;
  service_line?: string;
  aws_funded_tag?: string;
  alliance_motion?: string;
  strategic_account: boolean;
  
  // Phase milestones
  proposal_date?: string;
  sow_date?: string;
  po_date?: string;
  kickoff_date?: string;
  invoice_date?: string;
  payment_date?: string;
  revenue_date?: string;
  
  // Calculated fields
  current_phase: O2RPhase;
  health_signal: HealthSignal;
  days_in_phase: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
  last_sync_at?: string;
  
  // Relationships
  milestones: O2RMilestone[];
  activities: O2RActivity[];
}

export type O2RPhase = 'phase1' | 'phase2' | 'phase3' | 'phase4';
export type HealthSignal = 'green' | 'yellow' | 'red';

export interface O2RMilestone {
  id: string;
  opportunity_id: string;
  phase: O2RPhase;
  milestone_name: string;
  target_date?: string;
  completed_date?: string;
  status: 'pending' | 'completed' | 'delayed' | 'blocked';
}

export interface O2RDashboardMetrics {
  total_opportunities: number;
  total_value_sgd: number;
  phase_distribution: Record<O2RPhase, number>;
  health_distribution: Record<HealthSignal, number>;
  average_cycle_time: number;
  conversion_rates: Record<O2RPhase, number>;
}
```

## 🔧 Backend Service Implementation

### O2R Service Layer

```python
# app/services/o2r_service.py
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, timedelta
from app.models.o2r import O2ROpportunity, O2RMilestone
from app.services.zoho_service import ZohoService

class O2RService:
    def __init__(self, db: Session):
        self.db = db
        self.zoho_service = ZohoService()
    
    async def sync_opportunities_from_zoho(self) -> Dict[str, Any]:
        """Sync opportunities from Zoho CRM with O2R mapping"""
        try:
            # Fetch deals from Zoho CRM
            zoho_deals = await self.zoho_service.get_all_deals()
            
            synced_count = 0
            errors = []
            
            for deal in zoho_deals:
                try:
                    # Transform Zoho deal to O2R opportunity
                    o2r_data = self._transform_zoho_to_o2r(deal)
                    
                    # Upsert opportunity
                    opportunity = await self._upsert_opportunity(o2r_data)
                    
                    # Calculate health signals and phase
                    await self._update_opportunity_health(opportunity)
                    
                    synced_count += 1
                    
                except Exception as e:
                    errors.append(f"Deal {deal.get('id', 'unknown')}: {str(e)}")
            
            self.db.commit()
            
            return {
                "status": "success",
                "synced_count": synced_count,
                "total_deals": len(zoho_deals),
                "errors": errors
            }
            
        except Exception as e:
            self.db.rollback()
            raise Exception(f"O2R sync failed: {str(e)}")
    
    def _transform_zoho_to_o2r(self, zoho_deal: Dict[str, Any]) -> Dict[str, Any]:
        """Transform Zoho CRM deal to O2R opportunity format"""
        return {
            "zoho_deal_id": zoho_deal["id"],
            "name": zoho_deal["Deal_Name"],
            "account_name": zoho_deal["Account_Name"]["name"] if zoho_deal.get("Account_Name") else "",
            "amount_sgd": float(zoho_deal.get("Converted_OCH_Revenue", 0)),
            "probability": int(zoho_deal.get("Probability", 0)),
            "closing_date": self._parse_zoho_date(zoho_deal.get("Closing_Date")),
            
            # O2R business fields (mapped from Zoho custom fields)
            "territory": zoho_deal.get("Business_Region"),
            "service_line": zoho_deal.get("Solution_Type"),
            "aws_funded_tag": zoho_deal.get("Type_of_Funding"),
            "alliance_motion": zoho_deal.get("Market_Segment"),
            
            # Phase milestone dates
            "proposal_date": self._parse_zoho_date(zoho_deal.get("Proposal_Submission_date")),
            "po_date": self._parse_zoho_date(zoho_deal.get("PO_Generation_Date")),
            "kickoff_date": self._parse_zoho_date(zoho_deal.get("Kick_off_Date")),
            "invoice_date": self._parse_zoho_date(zoho_deal.get("Invoice_Date")),
            "payment_date": self._parse_zoho_date(zoho_deal.get("Received_On")),
            "revenue_date": self._parse_zoho_date(zoho_deal.get("OB_Recognition_Date")),
        }
    
    async def calculate_health_signal(self, opportunity: O2ROpportunity) -> str:
        """Calculate health signal based on phase delays and milestones"""
        today = datetime.utcnow().date()
        
        # Check for delays in each phase
        if opportunity.proposal_date and not opportunity.po_date:
            days_since_proposal = (today - opportunity.proposal_date.date()).days
            if days_since_proposal > 30:
                return 'red'  # Proposal stalled
            elif days_since_proposal > 14:
                return 'yellow'  # Proposal at risk
        
        if opportunity.po_date and not opportunity.kickoff_date:
            days_since_po = (today - opportunity.po_date.date()).days
            if days_since_po > 14:
                return 'yellow'  # Kickoff delayed
        
        if opportunity.kickoff_date and not opportunity.invoice_date:
            days_since_kickoff = (today - opportunity.kickoff_date.date()).days
            if days_since_kickoff > 60:
                return 'yellow'  # Execution delayed
        
        if opportunity.invoice_date and not opportunity.payment_date:
            days_since_invoice = (today - opportunity.invoice_date.date()).days
            if days_since_invoice > 45:
                return 'red'  # Payment overdue
        
        return 'green'  # On track
    
    async def get_dashboard_metrics(self) -> Dict[str, Any]:
        """Get O2R dashboard metrics and KPIs"""
        opportunities = self.db.query(O2ROpportunity).all()
        
        if not opportunities:
            return {
                "total_opportunities": 0,
                "total_value_sgd": 0,
                "phase_distribution": {},
                "health_distribution": {},
                "average_cycle_time": 0,
                "conversion_rates": {}
            }
        
        # Calculate metrics
        total_value = sum(opp.amount_sgd for opp in opportunities)
        
        # Phase distribution
        phase_dist = {}
        for phase in ['phase1', 'phase2', 'phase3', 'phase4']:
            phase_dist[phase] = len([o for o in opportunities if o.current_phase == phase])
        
        # Health distribution
        health_dist = {}
        for signal in ['green', 'yellow', 'red']:
            health_dist[signal] = len([o for o in opportunities if o.health_signal == signal])
        
        # Average cycle time (for completed opportunities)
        completed_opps = [o for o in opportunities if o.revenue_date]
        avg_cycle_time = 0
        if completed_opps:
            cycle_times = []
            for opp in completed_opps:
                if opp.proposal_date and opp.revenue_date:
                    cycle_time = (opp.revenue_date - opp.proposal_date).days
                    cycle_times.append(cycle_time)
            
            if cycle_times:
                avg_cycle_time = sum(cycle_times) / len(cycle_times)
        
        return {
            "total_opportunities": len(opportunities),
            "total_value_sgd": total_value,
            "phase_distribution": phase_dist,
            "health_distribution": health_dist,
            "average_cycle_time": avg_cycle_time,
            "opportunities": opportunities
        }
```

## 🔗 API Endpoints Implementation

### FastAPI Routes

```python
# app/api/endpoints/o2r.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.deps import get_db
from app.services.o2r_service import O2RService
from app.schemas.o2r import O2ROpportunityResponse, O2RDashboardResponse

router = APIRouter()

@router.get("/dashboard", response_model=O2RDashboardResponse)
async def get_o2r_dashboard(db: Session = Depends(get_db)):
    """Get O2R dashboard metrics and data"""
    try:
        service = O2RService(db)
        metrics = await service.get_dashboard_metrics()
        
        return O2RDashboardResponse(
            status="success",
            data=metrics
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync")
async def sync_opportunities(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Sync opportunities from Zoho CRM"""
    try:
        service = O2RService(db)
        
        # Run sync in background
        background_tasks.add_task(service.sync_opportunities_from_zoho)
        
        return {
            "status": "success",
            "message": "O2R sync started in background"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/opportunities", response_model=List[O2ROpportunityResponse])
async def get_opportunities(
    phase: Optional[str] = None,
    health_signal: Optional[str] = None,
    territory: Optional[str] = None,
    service_line: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get filtered list of O2R opportunities"""
    try:
        service = O2RService(db)
        opportunities = await service.get_opportunities(
            phase=phase,
            health_signal=health_signal,
            territory=territory,
            service_line=service_line,
            limit=limit,
            offset=offset
        )
        
        return opportunities
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/opportunities/{opportunity_id}/milestone")
async def update_milestone(
    opportunity_id: str,
    milestone_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Update opportunity milestone"""
    try:
        service = O2RService(db)
        updated_opportunity = await service.update_milestone(
            opportunity_id, milestone_data
        )
        
        return {
            "status": "success",
            "data": updated_opportunity
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## 🎨 Frontend Components Implementation

### O2R Dashboard Component

```tsx
// src/pages/O2RDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { RefreshCw, TrendingUp, DollarSign, Target, AlertTriangle } from 'lucide-react';
import { O2ROpportunity, O2RDashboardMetrics, HealthSignal } from '@/types/o2r';
import { o2rApi } from '@/services/o2rApi';
import { PhaseProgressChart } from '@/components/o2r/PhaseProgressChart';
import { HealthSignalIndicator } from '@/components/o2r/HealthSignalIndicator';
import { OpportunityCard } from '@/components/o2r/OpportunityCard';

export default function O2RDashboard() {
  const { toast } = useToast();
  
  // Fetch dashboard data
  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['o2r-dashboard'],
    queryFn: () => o2rApi.getDashboardMetrics(),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
  
  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: () => o2rApi.syncOpportunities(),
    onSuccess: () => {
      toast({
        title: "Sync Started",
        description: "O2R data sync has been initiated"
      });
      // Refetch data after a delay
      setTimeout(() => refetch(), 2000);
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>;
  }
  
  if (error) {
    return <div className="text-center text-destructive">
      Error loading O2R dashboard: {error.message}
    </div>;
  }
  
  const metrics = dashboardData?.data as O2RDashboardMetrics;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">O2R Tracker Dashboard</h1>
          <p className="text-muted-foreground">
            Track opportunities through 4-phase revenue realization process
          </p>
        </div>
        <Button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          Sync with CRM
        </Button>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              SGD {(metrics.total_value_sgd / 1000000).toFixed(2)}M
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.total_opportunities} opportunities
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Cycle Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(metrics.average_cycle_time)} days
            </div>
            <p className="text-xs text-muted-foreground">
              Proposal to revenue realization
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-green-500">
                {metrics.health_distribution.green || 0} On Track
              </Badge>
              <Badge variant="destructive">
                {metrics.health_distribution.red || 0} At Risk
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.health_distribution.yellow || 0} need attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phase Distribution</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Phase I</span>
                <span>{metrics.phase_distribution.phase1 || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Phase IV</span>
                <span>{metrics.phase_distribution.phase4 || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Phase Progress Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Phase Progression Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <PhaseProgressChart data={metrics.phase_distribution} />
        </CardContent>
      </Card>
      
      {/* At-Risk Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
            At-Risk Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Filter and show at-risk opportunities */}
            {dashboardData?.data?.opportunities
              ?.filter(opp => opp.health_signal === 'red')
              .slice(0, 6)
              .map(opportunity => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  onUpdate={refetch}
                />
              ))
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Opportunity Card Component

```tsx
// src/components/o2r/OpportunityCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, DollarSign, Building, MapPin } from 'lucide-react';
import { O2ROpportunity, HealthSignal } from '@/types/o2r';
import { HealthSignalIndicator } from './HealthSignalIndicator';
import { format } from 'date-fns';

interface OpportunityCardProps {
  opportunity: O2ROpportunity;
  onUpdate?: () => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  onUpdate
}) => {
  const getPhaseProgress = () => {
    const phases = ['phase1', 'phase2', 'phase3', 'phase4'];
    const currentIndex = phases.indexOf(opportunity.current_phase);
    return ((currentIndex + 1) / phases.length) * 100;
  };
  
  const getHealthVariant = (signal: HealthSignal) => {
    switch (signal) {
      case 'green': return 'default';
      case 'yellow': return 'secondary';
      case 'red': return 'destructive';
      default: return 'outline';
    }
  };
  
  const formatCurrency = (amount: number) => {
    return `SGD ${(amount / 1000).toFixed(0)}K`;
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base truncate flex-1 mr-2">
            {opportunity.name}
          </CardTitle>
          <HealthSignalIndicator signal={opportunity.health_signal} />
        </div>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Building className="h-4 w-4 mr-1" />
            {opportunity.account_name}
          </div>
          {opportunity.territory && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {opportunity.territory}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Value and Probability */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-lg font-semibold">
            <DollarSign className="h-4 w-4 mr-1" />
            {formatCurrency(opportunity.amount_sgd)}
          </div>
          <Badge variant="outline">
            {opportunity.probability}% probability
          </Badge>
        </div>
        
        {/* Phase Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Phase Progress</span>
            <span className="capitalize">{opportunity.current_phase.replace('phase', 'Phase ')}</span>
          </div>
          <Progress value={getPhaseProgress()} className="h-2" />
        </div>
        
        {/* Key Dates */}
        <div className="space-y-2">
          {opportunity.proposal_date && (
            <div className="flex items-center justify-between text-sm">
              <span>Proposal Date</span>
              <span>{format(new Date(opportunity.proposal_date), 'MMM dd, yyyy')}</span>
            </div>
          )}
          {opportunity.closing_date && (
            <div className="flex items-center justify-between text-sm">
              <span>Expected Close</span>
              <span>{format(new Date(opportunity.closing_date), 'MMM dd, yyyy')}</span>
            </div>
          )}
        </div>
        
        {/* Service Line and AWS Funding */}
        <div className="flex items-center justify-between">
          {opportunity.service_line && (
            <Badge variant="secondary" className="text-xs">
              {opportunity.service_line}
            </Badge>
          )}
          {opportunity.aws_funded_tag && (
            <Badge variant="outline" className="text-xs">
              AWS {opportunity.aws_funded_tag}
            </Badge>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            View Details
          </Button>
          <Button variant="default" size="sm" className="flex-1">
            Update Phase
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
```

## 🔗 API Service Integration

### Frontend API Service

```typescript
// src/services/o2rApi.ts
import { apiService } from './api';
import { O2ROpportunity, O2RDashboardMetrics } from '@/types/o2r';

class O2RApi {
  async getDashboardMetrics(): Promise<{ data: O2RDashboardMetrics }> {
    const response = await apiService.get('/o2r/dashboard');
    return response.data;
  }
  
  async getOpportunities(filters?: {
    phase?: string;
    health_signal?: string;
    territory?: string;
    service_line?: string;
    limit?: number;
    offset?: number;
  }): Promise<O2ROpportunity[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiService.get(`/o2r/opportunities?${params}`);
    return response.data;
  }
  
  async syncOpportunities(): Promise<{ status: string; message: string }> {
    const response = await apiService.post('/o2r/sync');
    return response.data;
  }
  
  async updateMilestone(
    opportunityId: string, 
    milestoneData: Record<string, any>
  ): Promise<O2ROpportunity> {
    const response = await apiService.put(
      `/o2r/opportunities/${opportunityId}/milestone`,
      milestoneData
    );
    return response.data;
  }
}

export const o2rApi = new O2RApi();
```

## 🧪 Testing Implementation

### Backend Tests

```python
# tests/test_o2r_service.py
import pytest
from unittest.mock import Mock, patch
from app.services.o2r_service import O2RService
from app.models.o2r import O2ROpportunity

@pytest.fixture
def mock_db():
    return Mock()

@pytest.fixture
def o2r_service(mock_db):
    return O2RService(mock_db)

@pytest.mark.asyncio
async def test_calculate_health_signal_green(o2r_service):
    """Test health signal calculation for on-track opportunity"""
    opportunity = Mock()
    opportunity.proposal_date = None
    opportunity.po_date = None
    opportunity.kickoff_date = None
    opportunity.invoice_date = None
    opportunity.payment_date = None
    
    result = await o2r_service.calculate_health_signal(opportunity)
    assert result == 'green'

@pytest.mark.asyncio
async def test_calculate_health_signal_red_payment_overdue(o2r_service):
    """Test health signal for overdue payment"""
    from datetime import datetime, timedelta
    
    opportunity = Mock()
    opportunity.proposal_date = None
    opportunity.po_date = None
    opportunity.kickoff_date = None
    opportunity.invoice_date = datetime.utcnow() - timedelta(days=50)
    opportunity.payment_date = None
    
    result = await o2r_service.calculate_health_signal(opportunity)
    assert result == 'red'

@pytest.mark.asyncio
async def test_transform_zoho_to_o2r(o2r_service):
    """Test Zoho deal transformation to O2R format"""
    zoho_deal = {
        "id": "123456789",
        "Deal_Name": "Test Opportunity",
        "Account_Name": {"name": "Test Account"},
        "Converted_OCH_Revenue": 100000,
        "Probability": 75,
        "Business_Region": "APAC",
        "Solution_Type": "Gen AI",
        "Type_of_Funding": "MAP",
        "Proposal_Submission_date": "2024-01-15"
    }
    
    result = o2r_service._transform_zoho_to_o2r(zoho_deal)
    
    assert result["zoho_deal_id"] == "123456789"
    assert result["name"] == "Test Opportunity"
    assert result["amount_sgd"] == 100000.0
    assert result["territory"] == "APAC"
    assert result["service_line"] == "Gen AI"
```

### Frontend Tests

```javascript
// tests/o2r-dashboard.spec.js
import { test, expect } from '@playwright/test';

test.describe('O2R Dashboard', () => {
  test('should load dashboard with metrics', async ({ page }) => {
    await page.goto('/o2r');
    
    // Check header
    await expect(page.locator('h1')).toContainText('O2R Tracker Dashboard');
    
    // Check key metrics cards
    await expect(page.locator('[data-testid="total-pipeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="cycle-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="health-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="phase-distribution"]')).toBeVisible();
    
    // Check sync button
    const syncButton = page.locator('button:has-text("Sync with CRM")');
    await expect(syncButton).toBeVisible();
  });
  
  test('should sync opportunities with CRM', async ({ page }) => {
    await page.goto('/o2r');
    
    // Click sync button
    await page.locator('button:has-text("Sync with CRM")').click();
    
    // Check for success message
    await expect(page.locator('.toast')).toContainText('Sync Started');
  });
  
  test('should display at-risk opportunities', async ({ page }) => {
    await page.goto('/o2r');
    
    // Check at-risk section
    const atRiskSection = page.locator('[data-testid="at-risk-opportunities"]');
    await expect(atRiskSection).toBeVisible();
    
    // Check for opportunity cards
    const opportunityCards = page.locator('[data-testid="opportunity-card"]');
    await expect(opportunityCards.first()).toBeVisible();
  });
  
  test('should show phase progress chart', async ({ page }) => {
    await page.goto('/o2r');
    
    // Check phase progress chart
    const progressChart = page.locator('[data-testid="phase-progress-chart"]');
    await expect(progressChart).toBeVisible();
  });
});
```

## 📋 Implementation Checklist

### Backend Implementation ✅

- [ ] Create O2R database models with proper relationships
- [ ] Implement Alembic migration for O2R tables
- [ ] Build O2RService with Zoho CRM integration
- [ ] Create API endpoints for dashboard and CRUD operations
- [ ] Implement health signal calculation algorithm
- [ ] Add phase progression logic
- [ ] Create background sync job
- [ ] Write comprehensive unit tests

### Frontend Implementation ✅

- [ ] Define TypeScript interfaces for O2R data
- [ ] Build O2R dashboard page with metrics
- [ ] Create reusable opportunity card component
- [ ] Implement phase progress visualization
- [ ] Add health signal indicators
- [ ] Build filtering and search functionality
- [ ] Create milestone update forms
- [ ] Add real-time data refresh
- [ ] Write E2E tests for critical flows

### Integration & Testing ✅

- [ ] Test Zoho CRM field mapping
- [ ] Verify health signal accuracy
- [ ] Test phase progression logic
- [ ] Validate currency conversion integration
- [ ] Test background sync performance
- [ ] Verify API response times
- [ ] Test error handling and rollback
- [ ] Validate data consistency

## 🚀 Advanced Features (Future Enhancements)

### AI-Powered Insights

- **Health Prediction**: ML models to predict opportunity health 30 days ahead
- **Cycle Time Optimization**: AI recommendations for accelerating phase progression
- **Risk Identification**: Pattern recognition for early risk detection

### Enhanced Analytics

- **Cohort Analysis**: Track opportunities by time period for trend analysis
- **Conversion Optimization**: Identify bottlenecks and improvement opportunities
- **Territory Performance**: Comparative analysis across regions and service lines

### Workflow Automation

- **Smart Notifications**: Proactive alerts for milestone delays
- **Automated Updates**: CRM field updates based on phase progression
- **Escalation Rules**: Automatic escalation for at-risk opportunities

## 🎯 Success Metrics

### Key Performance Indicators

- **Data Accuracy**: 95%+ accuracy in health signal predictions
- **Sync Performance**: Full CRM sync completes in < 5 minutes
- **User Adoption**: 100% of sales team using O2R tracker weekly
- **Revenue Impact**: 15% improvement in cycle time within 6 months

### Technical Metrics

- **API Performance**: < 500ms response time for dashboard
- **Uptime**: 99.9% availability for O2R services
- **Data Freshness**: CRM sync within 15 minutes of changes
- **Error Rate**: < 1% failed sync operations

Usage: `/build-o2r [component]` where component is `backend`, `frontend`, `integration`, or `full`
