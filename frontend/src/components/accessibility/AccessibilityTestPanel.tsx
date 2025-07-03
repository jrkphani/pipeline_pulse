import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Eye, 
  Keyboard, 
  MousePointer, 
  Volume2, 
  Contrast, 
  AlertTriangle,
  CheckCircle,
  Info,
  Zap
} from 'lucide-react'
import { 
  generateAccessibilityReport,
  validateTouchTargets,
  respectsReducedMotion,
  testFocusTrap,
  findFocusableElements,
  getTabOrder
} from '@/utils/accessibility-testing'

interface AccessibilityTestPanelProps {
  isVisible: boolean
  onClose: () => void
}

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: string[]
}

export function AccessibilityTestPanel({ isVisible, onClose }: AccessibilityTestPanelProps) {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [lastRun, setLastRun] = useState<Date | null>(null)

  const runAccessibilityTests = async () => {
    setIsRunning(true)
    const results: TestResult[] = []

    try {
      // Test 1: Keyboard Navigation
      const focusableElements = findFocusableElements()
      const tabOrder = getTabOrder()
      
      results.push({
        name: 'Keyboard Navigation',
        status: focusableElements.length > 0 ? 'pass' : 'fail',
        message: `Found ${focusableElements.length} focusable elements`,
        details: focusableElements.length === 0 ? ['No focusable elements found'] : undefined
      })

      // Test 2: Touch Targets
      const touchTargets = validateTouchTargets()
      const invalidTargets = touchTargets.filter(t => !t.meets44px)
      
      results.push({
        name: 'Touch Target Size',
        status: invalidTargets.length === 0 ? 'pass' : 'warning',
        message: `${touchTargets.length - invalidTargets.length}/${touchTargets.length} targets meet 44px minimum`,
        details: invalidTargets.length > 0 ? 
          invalidTargets.map(t => `Element ${t.element.tagName} is ${Math.round(t.size.width)}x${Math.round(t.size.height)}px`) : 
          undefined
      })

      // Test 3: Reduced Motion
      const respectsMotion = respectsReducedMotion()
      results.push({
        name: 'Reduced Motion',
        status: 'pass',
        message: respectsMotion ? 'User prefers reduced motion' : 'No motion preference detected'
      })

      // Test 4: ARIA Labels
      const report = generateAccessibilityReport()
      const errorCount = report.ariaIssues.filter(issue => issue.severity === 'error').length
      const warningCount = report.ariaIssues.filter(issue => issue.severity === 'warning').length
      
      results.push({
        name: 'ARIA Labels',
        status: errorCount === 0 ? (warningCount === 0 ? 'pass' : 'warning') : 'fail',
        message: `${errorCount} errors, ${warningCount} warnings`,
        details: report.ariaIssues.slice(0, 5).map(issue => `${issue.severity}: ${issue.issue}`)
      })

      // Test 5: Heading Hierarchy
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      let hierarchyValid = true
      let previousLevel = 0
      
      for (const heading of headings) {
        const level = parseInt(heading.tagName.charAt(1))
        if (level > previousLevel + 1) {
          hierarchyValid = false
          break
        }
        previousLevel = level
      }
      
      results.push({
        name: 'Heading Hierarchy',
        status: hierarchyValid ? 'pass' : 'warning',
        message: `${headings.length} headings found`,
        details: !hierarchyValid ? ['Heading levels are not sequential'] : undefined
      })

      // Test 6: Images Alt Text
      const images = Array.from(document.querySelectorAll('img'))
      const imagesWithoutAlt = images.filter(img => 
        !img.hasAttribute('alt') && img.getAttribute('role') !== 'presentation'
      )
      
      results.push({
        name: 'Image Alt Text',
        status: imagesWithoutAlt.length === 0 ? 'pass' : 'fail',
        message: `${images.length - imagesWithoutAlt.length}/${images.length} images have alt text`,
        details: imagesWithoutAlt.length > 0 ? 
          imagesWithoutAlt.slice(0, 3).map(img => `Image missing alt: ${img.src}`) : 
          undefined
      })

      // Test 7: Skip Links
      const skipLinks = document.querySelectorAll('[href="#main-content"], [data-skip-link]')
      results.push({
        name: 'Skip Links',
        status: skipLinks.length > 0 ? 'pass' : 'warning',
        message: `${skipLinks.length} skip links found`,
        details: skipLinks.length === 0 ? ['Consider adding skip links for keyboard users'] : undefined
      })

      setTestResults(results)
      setLastRun(new Date())
    } catch (error) {
      console.error('Error running accessibility tests:', error)
      results.push({
        name: 'Test Error',
        status: 'fail',
        message: 'Failed to complete accessibility tests',
        details: [error instanceof Error ? error.message : 'Unknown error']
      })
      setTestResults(results)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'fail':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Pass</Badge>
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>
    }
  }

  const summary = testResults.reduce((acc, result) => {
    acc[result.status] = (acc[result.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed right-4 top-4 bottom-4 w-96 bg-background border rounded-lg shadow-lg overflow-hidden">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <CardTitle>Accessibility Tests</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            </div>
            <CardDescription>
              Development tool for testing accessibility compliance
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto space-y-4">
            {/* Test Controls */}
            <div className="flex items-center justify-between">
              <Button 
                onClick={runAccessibilityTests} 
                disabled={isRunning}
                size="sm"
              >
                {isRunning ? (
                  <>
                    <Zap className="h-4 w-4 mr-2 animate-pulse" />
                    Running...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Run Tests
                  </>
                )}
              </Button>
              
              {lastRun && (
                <span className="text-xs text-muted-foreground">
                  Last run: {lastRun.toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Summary */}
            {testResults.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-green-600">
                      {summary.pass || 0} passed
                    </span>
                    <span className="text-yellow-600">
                      {summary.warning || 0} warnings
                    </span>
                    <span className="text-red-600">
                      {summary.fail || 0} failed
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Test Results */}
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium text-sm">{result.name}</span>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {result.message}
                  </p>
                  
                  {result.details && result.details.length > 0 && (
                    <div className="space-y-1">
                      {result.details.map((detail, detailIndex) => (
                        <div key={detailIndex} className="text-xs text-muted-foreground bg-muted rounded px-2 py-1">
                          {detail}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {testResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Click "Run Tests" to check accessibility</p>
              </div>
            )}
          </CardContent>

          {/* Quick Actions */}
          <div className="border-t p-4 space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Quick Tests
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const elements = findFocusableElements()
                  console.log('Focusable elements:', elements)
                }}
              >
                <Keyboard className="h-3 w-3 mr-1" />
                Focus
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const targets = validateTouchTargets()
                  console.log('Touch targets:', targets)
                }}
              >
                <MousePointer className="h-3 w-3 mr-1" />
                Touch
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const motion = respectsReducedMotion()
                  console.log('Reduced motion:', motion)
                }}
              >
                <Volume2 className="h-3 w-3 mr-1" />
                Motion
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  document.documentElement.classList.toggle('high-contrast')
                }}
              >
                <Contrast className="h-3 w-3 mr-1" />
                Contrast
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AccessibilityTestPanel