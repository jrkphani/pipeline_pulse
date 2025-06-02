import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Info,
  Calendar,
  DollarSign,
  TrendingUp,
  Users
} from 'lucide-react'

interface OpportunityStatusDetailsProps {
  opportunity: {
    id: string
    deal_name: string
    health_signal: string
    health_reason: string
    requires_attention: boolean
    current_phase: string
    sgd_amount: number
    last_updated: string
  }
}

export function OpportunityStatusDetails({ opportunity }: OpportunityStatusDetailsProps) {
  const getHealthIcon = (health: string) => {
    switch (health.toLowerCase()) {
      case 'green': return <CheckCircle className="h-4 w-4" />
      case 'yellow': return <Clock className="h-4 w-4" />
      case 'red': return <AlertTriangle className="h-4 w-4" />
      case 'blocked': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getHealthBadgeColor = (health: string) => {
    switch (health.toLowerCase()) {
      case 'green': return 'bg-green-100 text-green-800'
      case 'yellow': return 'bg-yellow-100 text-yellow-800'
      case 'red': return 'bg-red-100 text-red-800'
      case 'blocked': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusExplanation = (health: string, reason: string) => {
    const baseExplanations = {
      green: {
        title: 'Healthy Progress',
        description: 'This opportunity is progressing normally without any significant issues.',
        icon: <CheckCircle className="h-5 w-5 text-green-600" />
      },
      yellow: {
        title: 'Minor Concerns',
        description: 'This opportunity has some delays or warning signs that need monitoring.',
        icon: <Clock className="h-5 w-5 text-yellow-600" />
      },
      red: {
        title: 'Critical Issues',
        description: 'This opportunity has critical problems that require immediate action.',
        icon: <AlertTriangle className="h-5 w-5 text-red-600" />
      },
      blocked: {
        title: 'External Blockers',
        description: 'This opportunity is blocked by factors outside our direct control.',
        icon: <XCircle className="h-5 w-5 text-gray-600" />
      }
    }

    return baseExplanations[health.toLowerCase()] || baseExplanations.yellow
  }

  const getAttentionExplanation = (health: string, reason: string) => {
    if (!opportunity.requires_attention) {
      return {
        title: 'No Attention Required',
        description: 'This opportunity is being managed appropriately and does not need immediate intervention.',
        recommendations: ['Continue regular monitoring', 'Follow standard process']
      }
    }

    // Parse common attention reasons and provide specific explanations
    const lowerReason = reason.toLowerCase()
    
    if (lowerReason.includes('proposal stalled') || lowerReason.includes('days')) {
      const days = reason.match(/(\d+)\s*days?/)?.[1] || 'several'
      return {
        title: 'Proposal Response Overdue',
        description: `The customer has not responded to our proposal for ${days} days, which exceeds our normal response timeframe.`,
        recommendations: [
          'Contact customer to confirm proposal receipt',
          'Schedule follow-up meeting to address concerns',
          'Consider proposal modifications if needed',
          'Escalate to senior stakeholders if necessary'
        ]
      }
    }

    if (lowerReason.includes('payment overdue')) {
      const days = reason.match(/(\d+)\s*days?/)?.[1] || 'several'
      return {
        title: 'Payment Collection Required',
        description: `Payment is overdue by ${days} days, creating cash flow and revenue recognition risks.`,
        recommendations: [
          'Contact accounts payable department',
          'Verify invoice was received and processed',
          'Escalate to customer finance team',
          'Consider payment plan if needed'
        ]
      }
    }

    if (lowerReason.includes('overdue') && lowerReason.includes('without revenue')) {
      return {
        title: 'Deal Timeline Exceeded',
        description: 'This deal has passed its expected closing date without generating revenue, indicating potential forecast accuracy issues.',
        recommendations: [
          'Review and update deal status',
          'Reassess probability and timeline',
          'Identify specific blockers or delays',
          'Update forecast accordingly'
        ]
      }
    }

    if (lowerReason.includes('kickoff delayed')) {
      return {
        title: 'Project Start Delayed',
        description: 'The project kickoff has been delayed significantly after PO receipt, which may impact delivery timelines.',
        recommendations: [
          'Schedule kickoff meeting immediately',
          'Confirm resource availability',
          'Review project timeline and adjust if needed',
          'Communicate new timeline to stakeholders'
        ]
      }
    }

    if (lowerReason.includes('blocker')) {
      return {
        title: 'Active Blockers Present',
        description: 'There are reported blockers preventing progress on this opportunity.',
        recommendations: [
          'Identify specific blocker details',
          'Develop mitigation strategies',
          'Engage appropriate stakeholders',
          'Set timeline for blocker resolution'
        ]
      }
    }

    // Default attention explanation
    return {
      title: 'Immediate Attention Required',
      description: 'This opportunity has been flagged for immediate attention due to critical issues.',
      recommendations: [
        'Review opportunity details immediately',
        'Contact opportunity owner for status',
        'Identify specific action items',
        'Set follow-up timeline'
      ]
    }
  }

  const statusExplanation = getStatusExplanation(opportunity.health_signal, opportunity.health_reason)
  const attentionExplanation = getAttentionExplanation(opportunity.health_signal, opportunity.health_reason)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto p-1">
          <Info className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Status Details: {opportunity.deal_name}</span>
          </DialogTitle>
          <DialogDescription>
            Understanding why this opportunity has its current status and attention level
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Badge className={getHealthBadgeColor(opportunity.health_signal)}>
                {getHealthIcon(opportunity.health_signal)}
                <span className="ml-1 capitalize">{opportunity.health_signal}</span>
              </Badge>
              {opportunity.requires_attention && (
                <Badge variant="destructive">Attention Required</Badge>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                {statusExplanation.icon}
                <div className="space-y-2">
                  <h4 className="font-medium">{statusExplanation.title}</h4>
                  <p className="text-sm text-gray-600">{statusExplanation.description}</p>
                  {opportunity.health_reason && (
                    <div className="text-sm">
                      <span className="font-medium">Specific Reason: </span>
                      <span className="text-gray-700">{opportunity.health_reason}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Attention Details */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Attention Analysis</span>
            </h4>
            
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-orange-800">{attentionExplanation.title}</h5>
                  <p className="text-sm text-orange-700 mt-1">{attentionExplanation.description}</p>
                </div>
                
                <div>
                  <h6 className="text-sm font-medium text-orange-800 mb-2">Recommended Actions:</h6>
                  <ul className="text-sm text-orange-700 space-y-1">
                    {attentionExplanation.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Opportunity Context */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Current Phase:</span>
              </div>
              <p className="text-gray-600 ml-6">{opportunity.current_phase.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Value:</span>
              </div>
              <p className="text-gray-600 ml-6">SGD {(opportunity.sgd_amount / 1000000).toFixed(2)}M</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Last Updated:</span>
              </div>
              <p className="text-gray-600 ml-6">{new Date(opportunity.last_updated).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
