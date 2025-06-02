import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Info,
  HelpCircle,
  Calendar,
  DollarSign,
  Users,
  FileText
} from 'lucide-react'

interface StatusExplanationProps {
  className?: string
}

export function StatusExplanation({ className }: StatusExplanationProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  const statusDefinitions = {
    green: {
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'bg-green-100 text-green-800',
      title: 'Green - On Track',
      description: 'Opportunity is progressing normally without issues',
      criteria: [
        'All milestones are being met on time',
        'No overdue actions or payments',
        'Regular updates are being provided',
        'No reported blockers or issues'
      ],
      examples: [
        'Proposal sent within expected timeframe',
        'PO received and kickoff scheduled',
        'Project execution proceeding as planned',
        'Payments received on time'
      ]
    },
    yellow: {
      icon: <Clock className="h-4 w-4" />,
      color: 'bg-yellow-100 text-yellow-800',
      title: 'Yellow - Minor Delays',
      description: 'Opportunity has minor delays or warning signs that need monitoring',
      criteria: [
        'Kickoff delayed 14+ days after PO received',
        'Project execution running 60+ days',
        'High probability deal (80%+) without PO',
        'Low probability deal (≤20%) consuming resources'
      ],
      examples: [
        'Customer delayed kickoff meeting by 3 weeks',
        'Project timeline extended due to scope changes',
        'High-confidence deal stuck in procurement',
        'Resources allocated to uncertain opportunity'
      ]
    },
    red: {
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'bg-red-100 text-red-800',
      title: 'Red - Critical Issues',
      description: 'Opportunity has critical issues requiring immediate attention',
      criteria: [
        'Proposal stalled 30+ days without PO',
        'Payment overdue 45+ days after invoice',
        'Deal past closing date without revenue',
        'Critical milestone significantly delayed'
      ],
      examples: [
        'Customer not responding to proposal for 6 weeks',
        'Invoice sent 2 months ago, payment still pending',
        'Deal was supposed to close last quarter',
        'Project blocked by customer dependencies'
      ]
    },
    blocked: {
      icon: <XCircle className="h-4 w-4" />,
      color: 'bg-gray-100 text-gray-800',
      title: 'Blocked - External Dependencies',
      description: 'Opportunity is blocked by external factors beyond our control',
      criteria: [
        'Customer has reported blockers',
        'Waiting on third-party approvals',
        'Legal or compliance issues',
        'Budget freeze or organizational changes'
      ],
      examples: [
        'Customer budget approval pending',
        'Waiting for security clearance',
        'Legal review of contract terms',
        'Customer reorganization in progress'
      ]
    }
  }

  const attentionReasons = {
    title: 'Attention Required Criteria',
    description: 'Opportunities are marked as requiring attention when they have RED or BLOCKED status',
    triggers: [
      {
        category: 'Critical Delays',
        icon: <Calendar className="h-4 w-4 text-red-500" />,
        reasons: [
          'Proposal sent over 30 days ago without response',
          'Payment overdue by more than 45 days',
          'Deal past expected closing date without revenue'
        ]
      },
      {
        category: 'Financial Risk',
        icon: <DollarSign className="h-4 w-4 text-orange-500" />,
        reasons: [
          'High-value deals with payment delays',
          'Revenue recognition at risk',
          'Budget or funding issues reported'
        ]
      },
      {
        category: 'Customer Issues',
        icon: <Users className="h-4 w-4 text-blue-500" />,
        reasons: [
          'Customer not responding to communications',
          'Scope changes affecting timeline',
          'Customer-reported blockers or concerns'
        ]
      },
      {
        category: 'Process Issues',
        icon: <FileText className="h-4 w-4 text-purple-500" />,
        reasons: [
          'Missing required documentation',
          'Compliance or legal issues',
          'No status updates for extended periods'
        ]
      }
    ]
  }

  return (
    <div className={className}>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="mb-4">
            <HelpCircle className="h-4 w-4 mr-2" />
            Status Guide
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5" />
              <span>O2R Status & Attention Guide</span>
            </DialogTitle>
            <DialogDescription>
              Understanding opportunity health signals and attention requirements
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Health Status Definitions */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Health Status Colors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(statusDefinitions).map(([key, status]) => (
                  <Card key={key} className="border-l-4 border-l-current">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center space-x-2 text-sm">
                        <Badge className={status.color}>
                          {status.icon}
                          <span className="ml-1 capitalize">{key}</span>
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {status.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div>
                          <h5 className="text-xs font-medium text-gray-700 mb-1">Criteria:</h5>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {status.criteria.map((criterion, idx) => (
                              <li key={idx} className="flex items-start space-x-1">
                                <span className="text-gray-400 mt-1">•</span>
                                <span>{criterion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="text-xs font-medium text-gray-700 mb-1">Examples:</h5>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {status.examples.slice(0, 2).map((example, idx) => (
                              <li key={idx} className="flex items-start space-x-1">
                                <span className="text-gray-400 mt-1">•</span>
                                <span>{example}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Attention Required Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Attention Required</h3>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <span>{attentionReasons.title}</span>
                  </CardTitle>
                  <CardDescription>
                    {attentionReasons.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {attentionReasons.triggers.map((trigger, idx) => (
                      <div key={idx} className="space-y-2">
                        <h5 className="flex items-center space-x-2 text-sm font-medium">
                          {trigger.icon}
                          <span>{trigger.category}</span>
                        </h5>
                        <ul className="text-xs text-gray-600 space-y-1 ml-6">
                          {trigger.reasons.map((reason, reasonIdx) => (
                            <li key={reasonIdx} className="flex items-start space-x-1">
                              <span className="text-gray-400 mt-1">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Reference */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Reference</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="text-center p-2 bg-green-50 rounded">
                  <CheckCircle className="h-4 w-4 text-green-600 mx-auto mb-1" />
                  <div className="font-medium">Green</div>
                  <div className="text-gray-600">On Track</div>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded">
                  <Clock className="h-4 w-4 text-yellow-600 mx-auto mb-1" />
                  <div className="font-medium">Yellow</div>
                  <div className="text-gray-600">Minor Issues</div>
                </div>
                <div className="text-center p-2 bg-red-50 rounded">
                  <AlertTriangle className="h-4 w-4 text-red-600 mx-auto mb-1" />
                  <div className="font-medium">Red</div>
                  <div className="text-gray-600">Critical</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <XCircle className="h-4 w-4 text-gray-600 mx-auto mb-1" />
                  <div className="font-medium">Blocked</div>
                  <div className="text-gray-600">External</div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
