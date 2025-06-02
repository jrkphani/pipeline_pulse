import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle,
  TrendingUp
} from 'lucide-react'

interface HealthSummaryCardProps {
  opportunities: Array<{
    health_signal: string
    requires_attention: boolean
    sgd_amount: number
  }>
}

export function HealthSummaryCard({ opportunities }: HealthSummaryCardProps) {
  const healthCounts = {
    green: opportunities.filter(opp => opp.health_signal.toLowerCase() === 'green').length,
    yellow: opportunities.filter(opp => opp.health_signal.toLowerCase() === 'yellow').length,
    red: opportunities.filter(opp => opp.health_signal.toLowerCase() === 'red').length,
    blocked: opportunities.filter(opp => opp.health_signal.toLowerCase() === 'blocked').length,
  }

  const total = opportunities.length
  const attentionCount = opportunities.filter(opp => opp.requires_attention).length

  const healthPercentages = {
    green: total > 0 ? (healthCounts.green / total) * 100 : 0,
    yellow: total > 0 ? (healthCounts.yellow / total) * 100 : 0,
    red: total > 0 ? (healthCounts.red / total) * 100 : 0,
    blocked: total > 0 ? (healthCounts.blocked / total) * 100 : 0,
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'green': return <CheckCircle className="h-4 w-4" />
      case 'yellow': return <Clock className="h-4 w-4" />
      case 'red': return <AlertTriangle className="h-4 w-4" />
      case 'blocked': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'green': return 'text-green-600'
      case 'yellow': return 'text-yellow-600'
      case 'red': return 'text-red-600'
      case 'blocked': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getHealthDescription = (health: string, count: number, percentage: number) => {
    if (count === 0) return null
    
    const descriptions = {
      green: `${count} opportunities (${percentage.toFixed(0)}%) are progressing normally`,
      yellow: `${count} opportunities (${percentage.toFixed(0)}%) have minor delays or concerns`,
      red: `${count} opportunities (${percentage.toFixed(0)}%) have critical issues requiring immediate action`,
      blocked: `${count} opportunities (${percentage.toFixed(0)}%) are blocked by external factors`
    }
    
    return descriptions[health]
  }

  const overallHealth = () => {
    if (healthPercentages.red > 20 || healthPercentages.blocked > 10) {
      return { status: 'Critical', color: 'text-red-600', icon: <AlertTriangle className="h-5 w-5" /> }
    } else if (healthPercentages.yellow > 30 || healthPercentages.red > 0) {
      return { status: 'Needs Attention', color: 'text-yellow-600', icon: <Clock className="h-5 w-5" /> }
    } else {
      return { status: 'Healthy', color: 'text-green-600', icon: <CheckCircle className="h-5 w-5" /> }
    }
  }

  const overall = overallHealth()

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Portfolio Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-4">No opportunities to analyze</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Portfolio Health Overview</span>
        </CardTitle>
        <CardDescription>
          Health distribution across {total} opportunities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className={overall.color}>{overall.icon}</span>
            <span className="font-medium">Overall Status:</span>
          </div>
          <Badge variant="outline" className={overall.color}>
            {overall.status}
          </Badge>
        </div>

        {/* Health Breakdown */}
        <div className="space-y-3">
          {Object.entries(healthCounts).map(([health, count]) => {
            if (count === 0) return null
            const percentage = healthPercentages[health]
            const description = getHealthDescription(health, count, percentage)
            
            return (
              <div key={health} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={getHealthColor(health)}>
                      {getHealthIcon(health)}
                    </span>
                    <span className="text-sm font-medium capitalize">{health}</span>
                  </div>
                  <span className="text-sm text-gray-600">{count} ({percentage.toFixed(0)}%)</span>
                </div>
                <Progress value={percentage} className="h-2" />
                {description && (
                  <p className="text-xs text-gray-600 ml-6">{description}</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Attention Summary */}
        {attentionCount > 0 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                {attentionCount} opportunities require immediate attention
              </span>
            </div>
            <p className="text-xs text-orange-700 mt-1">
              These deals have critical issues or are blocked and need intervention to prevent revenue impact.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
