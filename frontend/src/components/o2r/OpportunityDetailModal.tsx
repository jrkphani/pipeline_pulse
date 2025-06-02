import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import {
  Save,
  RefreshCw,
  Calendar,
  DollarSign,
  User,
  Building,
  MapPin,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Loader2
} from 'lucide-react'

interface OpportunityDetailModalProps {
  opportunity: any
  isOpen: boolean
  onClose: () => void
  onUpdate: (updatedOpportunity: any) => void
}

export function OpportunityDetailModal({ 
  opportunity, 
  isOpen, 
  onClose, 
  onUpdate 
}: OpportunityDetailModalProps) {
  const [formData, setFormData] = useState<any>({
    deal_name: '',
    account_name: '',
    owner: '',
    sgd_amount: 0,
    probability: 0,
    current_stage: '',
    closing_date: '',
    territory: '',
    service_type: '',
    funding_type: '',
    market_segment: '',
    strategic_account: false,
    current_phase: 'phase_1',
    health_signal: 'needs_update',
    health_reason: '',
    comments: '',
    blockers: [],
    action_items: [],
    proposal_date: '',
    po_date: '',
    kickoff_date: '',
    invoice_date: '',
    payment_date: '',
    revenue_date: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (opportunity) {
      setFormData({
        deal_name: opportunity.deal_name || '',
        account_name: opportunity.account_name || '',
        owner: opportunity.owner || '',
        sgd_amount: opportunity.sgd_amount || 0,
        probability: opportunity.probability || 0,
        current_stage: opportunity.current_stage || '',
        closing_date: formatDateForInput(opportunity.closing_date),
        territory: opportunity.territory || '',
        service_type: opportunity.service_type || '',
        funding_type: opportunity.funding_type || '',
        market_segment: opportunity.market_segment || '',
        strategic_account: opportunity.strategic_account || false,
        current_phase: opportunity.current_phase || 'phase_1',
        health_signal: opportunity.health_signal || 'needs_update',
        health_reason: opportunity.health_reason || '',
        comments: opportunity.comments || '',
        blockers: opportunity.blockers || [],
        action_items: opportunity.action_items || [],
        // Milestone dates - format dates properly for HTML date inputs
        proposal_date: formatDateForInput(opportunity.proposal_date),
        po_date: formatDateForInput(opportunity.po_date),
        kickoff_date: formatDateForInput(opportunity.kickoff_date),
        invoice_date: formatDateForInput(opportunity.invoice_date),
        payment_date: formatDateForInput(opportunity.payment_date),
        revenue_date: formatDateForInput(opportunity.revenue_date)
      })
    }
  }, [opportunity])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] || []).map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayItem = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }))
  }

  const removeArrayItem = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index)
    }))
  }

  const formatCurrency = (amount: number) => {
    return `SGD ${(amount / 1000000).toFixed(2)}M`
  }

  const formatDateForInput = (dateString: string | null | undefined) => {
    if (!dateString) return ''
    // Handle both ISO date strings and date-only strings
    return dateString.includes('T') ? dateString.split('T')[0] : dateString
  }

  const getHealthIcon = (health: string) => {
    if (!health) return <Clock className="h-4 w-4 text-blue-600" />

    switch (health.toLowerCase()) {
      case 'green': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'yellow': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'red': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'blocked': return <XCircle className="h-4 w-4 text-gray-600" />
      default: return <Clock className="h-4 w-4 text-blue-600" />
    }
  }

  const getHealthBadgeColor = (health: string) => {
    if (!health) return 'bg-gray-100 text-gray-800'

    switch (health.toLowerCase()) {
      case 'green': return 'bg-green-100 text-green-800'
      case 'yellow': return 'bg-yellow-100 text-yellow-800'
      case 'red': return 'bg-red-100 text-red-800'
      case 'blocked': return 'bg-gray-100 text-gray-800'
      case 'needs_update': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Update in local database
      const updateResponse = await fetch(`/api/o2r/opportunities/${opportunity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          updated_by: 'User' // You might want to get this from auth context
        })
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to update opportunity in database')
      }

      const updatedOpportunity = await updateResponse.json()

      // Sync to Zoho CRM if zoho_id exists
      if (opportunity.zoho_id) {
        try {
          const zohoUpdateData = {
            Deal_Name: formData.deal_name,
            Account_Name: formData.account_name,
            Owner: formData.owner,
            Amount: formData.sgd_amount,
            Probability: formData.probability,
            Stage: formData.current_stage,
            Closing_Date: formData.closing_date,
            // Add other Zoho-specific field mappings as needed
          }

          const zohoResponse = await fetch(`/api/zoho/deals/${opportunity.zoho_id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(zohoUpdateData)
          })

          if (zohoResponse.ok) {
            toast({
              title: "Success",
              description: "Opportunity updated in both database and Zoho CRM",
            })
          } else {
            toast({
              title: "Partial Success",
              description: "Opportunity updated in database, but failed to sync to Zoho CRM",
              variant: "destructive"
            })
          }
        } catch (zohoError) {
          console.error('Zoho sync error:', zohoError)
          toast({
            title: "Partial Success", 
            description: "Opportunity updated in database, but failed to sync to Zoho CRM",
            variant: "destructive"
          })
        }
      } else {
        toast({
          title: "Success",
          description: "Opportunity updated successfully",
        })
      }

      onUpdate(updatedOpportunity)
      onClose()

    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: "Error",
        description: "Failed to update opportunity",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!opportunity) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>{opportunity.deal_name}</span>
          </DialogTitle>
          <DialogDescription>
            Complete opportunity details and milestone tracking
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="health">Health & Status</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deal_name">Deal Name</Label>
                    <Input
                      id="deal_name"
                      value={formData.deal_name}
                      onChange={(e) => handleInputChange('deal_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_name">Account Name</Label>
                    <Input
                      id="account_name"
                      value={formData.account_name}
                      onChange={(e) => handleInputChange('account_name', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="owner">Owner</Label>
                    <Input
                      id="owner"
                      value={formData.owner}
                      onChange={(e) => handleInputChange('owner', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sgd_amount">Amount (SGD)</Label>
                    <Input
                      id="sgd_amount"
                      type="number"
                      value={formData.sgd_amount}
                      onChange={(e) => handleInputChange('sgd_amount', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="probability">Probability (%)</Label>
                    <Input
                      id="probability"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.probability}
                      onChange={(e) => handleInputChange('probability', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current_stage">Current Stage</Label>
                    <Input
                      id="current_stage"
                      value={formData.current_stage}
                      onChange={(e) => handleInputChange('current_stage', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="closing_date" className="flex items-center justify-between">
                      <span>Closing Date</span>
                      {!formData.closing_date && <span className="text-xs text-gray-400">(Not set)</span>}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="closing_date"
                        type="date"
                        value={formData.closing_date}
                        onChange={(e) => handleInputChange('closing_date', e.target.value)}
                        className="flex-1"
                      />
                      {formData.closing_date && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange('closing_date', '')}
                          className="px-2"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="milestones" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>O2R Milestone Dates</span>
                </CardTitle>
                <CardDescription>
                  Track key dates in the opportunity-to-revenue journey
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="proposal_date" className="flex items-center justify-between">
                      <span>Proposal Submission Date</span>
                      {!formData.proposal_date && <span className="text-xs text-gray-400">(Not set)</span>}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="proposal_date"
                        type="date"
                        value={formData.proposal_date}
                        onChange={(e) => handleInputChange('proposal_date', e.target.value)}
                        className="flex-1"
                      />
                      {formData.proposal_date && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange('proposal_date', '')}
                          className="px-2"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="po_date" className="flex items-center justify-between">
                      <span>PO Generation Date</span>
                      {!formData.po_date && <span className="text-xs text-gray-400">(Not set)</span>}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="po_date"
                        type="date"
                        value={formData.po_date}
                        onChange={(e) => handleInputChange('po_date', e.target.value)}
                        className="flex-1"
                      />
                      {formData.po_date && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange('po_date', '')}
                          className="px-2"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kickoff_date" className="flex items-center justify-between">
                      <span>Kick-off Date</span>
                      {!formData.kickoff_date && <span className="text-xs text-gray-400">(Not set)</span>}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="kickoff_date"
                        type="date"
                        value={formData.kickoff_date}
                        onChange={(e) => handleInputChange('kickoff_date', e.target.value)}
                        className="flex-1"
                      />
                      {formData.kickoff_date && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange('kickoff_date', '')}
                          className="px-2"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice_date" className="flex items-center justify-between">
                      <span>Invoice Date</span>
                      {!formData.invoice_date && <span className="text-xs text-gray-400">(Not set)</span>}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="invoice_date"
                        type="date"
                        value={formData.invoice_date}
                        onChange={(e) => handleInputChange('invoice_date', e.target.value)}
                        className="flex-1"
                      />
                      {formData.invoice_date && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange('invoice_date', '')}
                          className="px-2"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment_date" className="flex items-center justify-between">
                      <span>Payment Received Date</span>
                      {!formData.payment_date && <span className="text-xs text-gray-400">(Not set)</span>}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="payment_date"
                        type="date"
                        value={formData.payment_date}
                        onChange={(e) => handleInputChange('payment_date', e.target.value)}
                        className="flex-1"
                      />
                      {formData.payment_date && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange('payment_date', '')}
                          className="px-2"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="revenue_date" className="flex items-center justify-between">
                      <span>Revenue Recognition Date</span>
                      {!formData.revenue_date && <span className="text-xs text-gray-400">(Not set)</span>}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="revenue_date"
                        type="date"
                        value={formData.revenue_date}
                        onChange={(e) => handleInputChange('revenue_date', e.target.value)}
                        className="flex-1"
                      />
                      {formData.revenue_date && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange('revenue_date', '')}
                          className="px-2"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>Health Signal & Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="health_signal">Health Signal</Label>
                    <Select
                      value={formData.health_signal}
                      onValueChange={(value) => handleInputChange('health_signal', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select health signal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="green">🟢 Green - On Track</SelectItem>
                        <SelectItem value="yellow">🟡 Yellow - Minor Issues</SelectItem>
                        <SelectItem value="red">🔴 Red - Critical Issues</SelectItem>
                        <SelectItem value="blocked">⚫ Blocked - External Dependencies</SelectItem>
                        <SelectItem value="needs_update">🔵 Needs Update</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current_phase">Current O2R Phase</Label>
                    <Select
                      value={formData.current_phase}
                      onValueChange={(value) => handleInputChange('current_phase', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select phase" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phase_1">Phase 1 - Opportunity</SelectItem>
                        <SelectItem value="phase_2">Phase 2 - Proposal</SelectItem>
                        <SelectItem value="phase_3">Phase 3 - Contract</SelectItem>
                        <SelectItem value="phase_4">Phase 4 - Delivery</SelectItem>
                        <SelectItem value="phase_5">Phase 5 - Revenue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="health_reason">Health Reason</Label>
                  <Textarea
                    id="health_reason"
                    value={formData.health_reason}
                    onChange={(e) => handleInputChange('health_reason', e.target.value)}
                    placeholder="Explain the current health status..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Badge className={getHealthBadgeColor(formData.health_signal)}>
                    {getHealthIcon(formData.health_signal)}
                    <span className="ml-1">{formData.health_signal}</span>
                  </Badge>
                  <span className="text-sm text-gray-500">Current Status</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Additional Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="territory">Territory</Label>
                    <Input
                      id="territory"
                      value={formData.territory}
                      onChange={(e) => handleInputChange('territory', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service_type">Service Type</Label>
                    <Input
                      id="service_type"
                      value={formData.service_type}
                      onChange={(e) => handleInputChange('service_type', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="funding_type">Funding Type</Label>
                    <Input
                      id="funding_type"
                      value={formData.funding_type}
                      onChange={(e) => handleInputChange('funding_type', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comments">Comments</Label>
                  <Textarea
                    id="comments"
                    value={formData.comments}
                    onChange={(e) => handleInputChange('comments', e.target.value)}
                    placeholder="Add any additional comments or notes..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Blockers</Label>
                  {(formData.blockers || []).map((blocker, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={blocker}
                        onChange={(e) => handleArrayChange('blockers', index, e.target.value)}
                        placeholder="Describe blocker..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('blockers', index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('blockers')}
                  >
                    Add Blocker
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Action Items</Label>
                  {(formData.action_items || []).map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={item}
                        onChange={(e) => handleArrayChange('action_items', index, e.target.value)}
                        placeholder="Describe action item..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('action_items', index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('action_items')}
                  >
                    Add Action Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save & Sync to CRM
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
