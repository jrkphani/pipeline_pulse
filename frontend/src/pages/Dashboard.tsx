import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  DollarSign,
  Target,
  RefreshCw,
  BarChart3,
  Globe,
  Users
} from 'lucide-react'

// Enhanced Pipeline Pulse imports
import { PageLayout, PageHeader } from '@/components/ui/page-layout'
import { GridLayout } from '@/components/ui/grid-layout'
import { MetricCard } from '@/components/ui/metric-card'
import { EnhancedCard, EnhancedCardContent, EnhancedCardHeader, EnhancedCardTitle, EnhancedCardDescription } from '@/components/ui/enhanced-card'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { StatusIndicator } from '@/components/ui/status-indicator'
import { EnhancedBadge } from '@/components/ui/enhanced-badge'
import { DataSourceIndicator } from '@/components/DataSourceIndicator'
import { ConnectionStatus, LiveSyncIndicator } from '@/components/ConnectionStatus'

import { useLivePipeline } from '@/hooks/useLivePipeline'
import { businessClassNames, getDealTrendData } from '@/lib/ui-utils'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  // Use live pipeline data
  const {
    data: deals,
    summary,
    syncStatus,
    isLoading,
    error,
    triggerSync,
    refetch
  } = useLivePipeline()

  // Enhanced stats calculation
  const calculateStats = () => {
    if (!summary || summary.total_deals === 0) {
      return [
        {
          title: "Total Pipeline",
          value: "SGD 0",
          description: "No data available",
          icon: DollarSign,
          trend: { value: "Connect CRM to see metrics", type: "neutral" as const }
        },
        {
          title: "Average Probability",
          value: "0%",
          description: "No deals to analyze",
          icon: TrendingUp,
          trend: { value: "Connect to your CRM", type: "neutral" as const }
        },
        {
          title: "Total Deals",
          value: "0",
          description: "No deals processed",
          icon: Target,
          trend: { value: "Connect CRM to see metrics", type: "neutral" as const }
        },
        {
          title: "Pipeline Stages",
          value: "0",
          description: "No active stages",
          icon: Globe,
          trend: { value: "Get started by connecting CRM", type: "neutral" as const }
        }
      ]
    }

    return [
      {
        title: "Total Pipeline",
        value: businessClassNames.formatCompactCurrency(summary.total_value),
        description: `${summary.total_deals} active deals`,
        icon: DollarSign,
        trend: { 
          value: syncStatus.isConnected ? "Live CRM data" : "Disconnected", 
          type: syncStatus.isConnected ? "positive" as const : "warning" as const,
          icon: <TrendingUp className="h-3 w-3" />
        }
      },
      {
        title: "Average Probability",
        value: `${Math.round(summary.avg_probability)}%`,
        description: "Deal success rate",
        icon: TrendingUp,
        trend: { 
          value: summary.avg_probability >= 60 ? "Strong pipeline" : "Needs attention",
          type: summary.avg_probability >= 60 ? "positive" as const : "warning" as const
        }
      },
      {
        title: "Total Deals",
        value: summary.total_deals.toString(),
        description: "Active opportunities",
        icon: Target,
        trend: { 
          value: `${Object.keys(summary.deals_by_stage).length} stages`,
          type: "neutral" as const
        }
      },
      {
        title: "Pipeline Stages",
        value: Object.keys(summary.deals_by_stage).length.toString(),
        description: "Active sales stages",
        icon: Globe,
        trend: { 
          value: syncStatus.lastSync ? `Synced ${new Date(syncStatus.lastSync).toLocaleTimeString()}` : "Never synced",
          type: syncStatus.isConnected ? "positive" as const : "neutral" as const
        }
      }
    ]
  }

  const stats = calculateStats()

  return (
    <PageLayout>
      <PageHeader
        title="Pipeline Pulse Dashboard"
        description="Transform your Zoho CRM data into actionable revenue insights with real-time synchronization and intelligent analytics."
        actions={
          <div className="flex items-center space-x-4">
            <LiveSyncIndicator 
              isConnected={syncStatus.isConnected} 
              lastSync={syncStatus.lastSync}
            />
            <div className="flex space-x-2">
              <EnhancedButton variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Reports
              </EnhancedButton>
              <EnhancedButton 
                variant="default" 
                size="sm"
                onClick={triggerSync}
                disabled={syncStatus.syncInProgress}
              >
                <RefreshCw className={cn(
                  "h-4 w-4 mr-2",
                  syncStatus.syncInProgress && "animate-spin"
                )} />
                {syncStatus.syncInProgress ? "Syncing..." : "Sync CRM"}
              </EnhancedButton>
            </div>
          </div>
        }
      />

      {/* Connection Status */}
      {syncStatus.isConnected && (
        <div className="mb-8">
          <ConnectionStatus
            lastSync={syncStatus.lastSync}
            isConnected={syncStatus.isConnected}
            syncInProgress={syncStatus.syncInProgress}
            nextSyncIn={syncStatus.nextSyncIn}
            onSync={triggerSync}
          />
        </div>
      )}

      {/* Quick Actions */}
      <GridLayout cols={3} className="mb-8">
        <EnhancedCard hoverable>
          <Link to="/crm-sync" className="block">
            <EnhancedCardHeader>
              <div className="flex items-center justify-between">
                <EnhancedCardTitle className="text-base">Live CRM Sync</EnhancedCardTitle>
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
            </EnhancedCardHeader>
            <EnhancedCardContent>
              <p className="text-sm text-muted-foreground">
                Real-time synchronization with your Zoho CRM data
              </p>
            </EnhancedCardContent>
          </Link>
        </EnhancedCard>
        
        <EnhancedCard hoverable>
          <Link to="/crm-sync" className="block">
            <EnhancedCardHeader>
              <div className="flex items-center justify-between">
                <EnhancedCardTitle className="text-base">CRM Integration</EnhancedCardTitle>
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
            </EnhancedCardHeader>
            <EnhancedCardContent>
              <p className="text-sm text-muted-foreground">
                Connect directly to Zoho CRM for real-time data and updates
              </p>
            </EnhancedCardContent>
          </Link>
        </EnhancedCard>

        <EnhancedCard hoverable>
          <Link to="/o2r" className="block">
            <EnhancedCardHeader>
              <div className="flex items-center justify-between">
                <EnhancedCardTitle className="text-base">O2R Tracker</EnhancedCardTitle>
                <Target className="h-5 w-5 text-primary" />
              </div>
            </EnhancedCardHeader>
            <EnhancedCardContent>
              <p className="text-sm text-muted-foreground">
                Track opportunities from lead to revenue realization
              </p>
            </EnhancedCardContent>
          </Link>
        </EnhancedCard>
      </GridLayout>

      {/* Enhanced Stats Grid */}
      <GridLayout cols={4} className="mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <MetricCard
              key={index}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              trend={stat.trend}
              icon={<Icon className="h-6 w-6" />}
              loading={isLoading}
            />
          )
        })}
      </GridLayout>

      {/* Enhanced Content Grid */}
      <GridLayout cols={2} className="mb-8">
        <EnhancedCard>
          <EnhancedCardHeader>
            <EnhancedCardTitle>Recent Deals</EnhancedCardTitle>
            <EnhancedCardDescription>
              Your latest opportunities from CRM
            </EnhancedCardDescription>
          </EnhancedCardHeader>
          <EnhancedCardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading deals...</p>
                </div>
              ) : deals.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <p className="text-sm text-muted-foreground">No deals found</p>
                  <p className="text-xs text-muted-foreground">Connect your CRM to get started</p>
                  <EnhancedButton asChild size="sm">
                    <Link to="/crm-sync">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Connect CRM
                    </Link>
                  </EnhancedButton>
                </div>
              ) : (
                deals.slice(0, 5).map((deal) => (
                  <div key={deal.record_id} className="flex items-center justify-between p-4 border rounded-lg pp-hover-lift">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">{deal.opportunity_name}</p>
                        <EnhancedBadge 
                          variant={deal.probability >= 70 ? "success" : deal.probability >= 40 ? "warning" : "secondary"}
                          className="text-xs"
                        >
                          {deal.probability}%
                        </EnhancedBadge>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>{deal.account_name}</span>
                        <span>{businessClassNames.formatCompactCurrency(deal.sgd_amount)}</span>
                        <span>{deal.stage}</span>
                      </div>
                    </div>
                    <EnhancedButton variant="outline" size="sm" asChild>
                      <Link to={`/o2r/opportunities?deal=${deal.record_id}`}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </EnhancedButton>
                  </div>
                ))
              )}
            </div>
          </EnhancedCardContent>
        </EnhancedCard>

        <EnhancedCard>
          <EnhancedCardHeader>
            <EnhancedCardTitle>Pipeline Health</EnhancedCardTitle>
            <EnhancedCardDescription>
              Current status of your revenue pipeline
            </EnhancedCardDescription>
          </EnhancedCardHeader>
          <EnhancedCardContent>
            <div className="space-y-4">
              <StatusIndicator
                status={syncStatus.isConnected ? "healthy" : "warning"}
                label="CRM Connection"
                description={syncStatus.isConnected ? "Connected to Zoho CRM" : "Not connected"}
              />
              <StatusIndicator
                status={syncStatus.lastSync ? "healthy" : "info"}
                label="Data Freshness"
                description={syncStatus.lastSync ? `Last sync: ${new Date(syncStatus.lastSync).toLocaleTimeString()}` : "Never synced"}
              />
              <StatusIndicator
                status="healthy"
                label="System Status"
                description="All systems operational"
              />
              
              {summary && summary.total_deals > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Pipeline Overview</span>
                    <span className="text-sm text-muted-foreground">
                      {summary.total_deals} deal{summary.total_deals !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <EnhancedButton 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={triggerSync}
                      disabled={syncStatus.syncInProgress}
                    >
                      <RefreshCw className={cn(
                        "h-4 w-4 mr-2",
                        syncStatus.syncInProgress && "animate-spin"
                      )} />
                      {syncStatus.syncInProgress ? "Syncing..." : "Sync Now"}
                    </EnhancedButton>
                    <EnhancedButton variant="default" size="sm" asChild className="w-full">
                      <Link to="/o2r">
                        <Target className="h-4 w-4 mr-2" />
                        View O2R Tracker
                      </Link>
                    </EnhancedButton>
                  </div>
                </div>
              )}
            </div>
          </EnhancedCardContent>
        </EnhancedCard>
      </GridLayout>

      {/* Getting Started Section */}
      <EnhancedCard>
        <EnhancedCardHeader>
          <EnhancedCardTitle>Getting Started with Pipeline Pulse</EnhancedCardTitle>
          <EnhancedCardDescription>
            New to Pipeline Pulse? Follow these steps to analyze your pipeline
          </EnhancedCardDescription>
        </EnhancedCardHeader>
        <EnhancedCardContent>
          <GridLayout cols={3}>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <h3 className="font-semibold">Connect to Zoho CRM</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-11">
                Establish a secure connection to your Zoho CRM for real-time data synchronization
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="bg-success text-success-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <h3 className="font-semibold">Sync & Analyze</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-11">
                Automatic synchronization provides instant pipeline analysis with SGD standardization
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="bg-forecast text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <h3 className="font-semibold">Take Action</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-11">
                Use insights to prioritize deals and sync updates back to your CRM
              </p>
            </div>
          </GridLayout>
        </EnhancedCardContent>
      </EnhancedCard>
    </PageLayout>
  )
}