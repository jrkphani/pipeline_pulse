

// Business-specific utility functions for Pipeline Pulse
export const businessClassNames = {
  dealPriority: (priority: 'high' | 'medium' | 'low') => 
    `deal-priority-${priority}`,
    
  pipelineStage: (stage: 'early' | 'middle' | 'late') => 
    `pipeline-stage-${stage}`,
    
  revenueDirection: (value: number) => 
    value > 0 ? 'revenue-positive' : 'revenue-negative',
    
  healthStatus: (status: 'healthy' | 'warning' | 'critical') => ({
    healthy: 'text-success bg-success-light border-success',
    warning: 'text-warning bg-warning-light border-warning', 
    critical: 'text-destructive bg-destructive-light border-destructive'
  })[status],

  badgeVariant: (type: 'revenue' | 'pipeline' | 'opportunity' | 'risk' | 'forecast') => type,

  getStatusFromProbability: (probability: number): 'healthy' | 'warning' | 'critical' => {
    if (probability >= 70) return 'healthy'
    if (probability >= 40) return 'warning'
    return 'critical'
  },

  formatCurrency: (amount: number, currency: string = 'SGD') => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  },

  formatCompactCurrency: (amount: number, currency: string = 'SGD') => {
    const formatter = new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: currency,
      notation: 'compact',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    })
    return formatter.format(amount)
  },

  getPriorityFromAmount: (amount: number): 'high' | 'medium' | 'low' => {
    if (amount >= 100000) return 'high'
    if (amount >= 25000) return 'medium'
    return 'low'
  },

  getStageFromProbability: (probability: number): 'early' | 'middle' | 'late' => {
    if (probability >= 70) return 'late'
    if (probability >= 30) return 'middle'
    return 'early'
  }
}

// Typography utility classes
export const typography = {
  headingHero: 'pp-heading-hero',
  headingPage: 'pp-heading-page', 
  headingSection: 'pp-heading-section',
  headingCard: 'pp-heading-card',
  bodyLarge: 'pp-body-large',
  body: 'pp-body',
  bodySmall: 'pp-body-small',
  metricLarge: 'pp-metric-large',
  metric: 'pp-metric',
  caption: 'pp-caption'
}

// Layout utility classes
export const layout = {
  page: 'pp-page',
  grid: 'pp-grid',
  grid2: 'pp-grid--2',
  grid3: 'pp-grid--3', 
  grid4: 'pp-grid--4',
  gridResponsive2: 'pp-grid--responsive-2',
  gridResponsive3: 'pp-grid--responsive-3',
  gridResponsive4: 'pp-grid--responsive-4',
  container: 'pp-container'
}

// Animation utility classes
export const animations = {
  hoverLift: 'pp-hover-lift',
  loading: 'pp-loading',
  dealCardEnter: 'deal-card-enter',
  metricUpdate: 'metric-update'
}

// Business component helper functions
export const getHealthSignal = (
  opportunityAmount: number,
  probability: number,
  daysInStage: number
): { status: 'healthy' | 'warning' | 'critical', message: string } => {
  // High value deals with low probability
  if (opportunityAmount > 100000 && probability < 30) {
    return { status: 'critical', message: 'High-value deal at risk' }
  }
  
  // Deals stuck in stage too long
  if (daysInStage > 30) {
    return { status: 'warning', message: 'Deal stagnant in current stage' }
  }
  
  // High probability deals
  if (probability >= 70) {
    return { status: 'healthy', message: 'Strong likelihood to close' }
  }
  
  // Medium probability
  if (probability >= 40) {
    return { status: 'warning', message: 'Needs attention to progress' }
  }
  
  // Low probability
  return { status: 'critical', message: 'Low probability of closing' }
}

export const getDealTrendData = (deals: Array<{ created_time: string; sgd_amount: number }>) => {
  const currentMonth = new Date().getMonth()
  const lastMonth = currentMonth - 1
  
  const currentMonthDeals = deals.filter(deal => 
    new Date(deal.created_time).getMonth() === currentMonth
  )
  
  const lastMonthDeals = deals.filter(deal => 
    new Date(deal.created_time).getMonth() === lastMonth
  )
  
  const currentValue = currentMonthDeals.reduce((sum, deal) => sum + deal.sgd_amount, 0)
  const lastValue = lastMonthDeals.reduce((sum, deal) => sum + deal.sgd_amount, 0)
  
  const change = lastValue > 0 ? ((currentValue - lastValue) / lastValue) * 100 : 0
  
  return {
    current: currentValue,
    change: change,
    type: change > 0 ? 'positive' as const : change < 0 ? 'negative' as const : 'neutral' as const,
    formatted: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
  }
}