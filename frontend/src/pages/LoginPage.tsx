import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ExternalLink, AlertCircle, CheckCircle, BarChart3, TrendingUp, Globe } from 'lucide-react'

export default function LoginPage() {
  const { login, checkAuthStatus } = useAuth()
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    handleOAuthCallback()
  }, [])

  const handleOAuthCallback = async () => {
    // Check for OAuth callback parameters
    const successParam = searchParams.get('success')
    const errorParam = searchParams.get('error')
    const user = searchParams.get('user')
    const message = searchParams.get('message')

    if (successParam === 'true') {
      // OAuth success
      setSuccess(`Successfully connected to Zoho CRM! Welcome, ${user || 'User'}!`)
      // Clear URL parameters
      setSearchParams({})
      // Check auth status to update context
      await checkAuthStatus()
    } else if (errorParam) {
      // OAuth error
      let errorMessage = 'Failed to connect to Zoho CRM'
      
      switch (errorParam) {
        case 'oauth_error':
          errorMessage = `OAuth error: ${message || 'Unknown error'}`
          break
        case 'missing_params':
          errorMessage = 'Missing required parameters from Zoho'
          break
        case 'invalid_state':
          errorMessage = 'Invalid security state - please try again'
          break
        case 'state_expired':
          errorMessage = 'Connection request expired - please try again'
          break
        case 'callback_failed':
          errorMessage = `Connection failed: ${message || 'Unknown error'}`
          break
        default:
          errorMessage = `Connection error: ${errorParam}`
      }
      
      setError(errorMessage)
      // Clear URL parameters
      setSearchParams({})
    }
  }

  const handleLogin = async () => {
    try {
      setIsConnecting(true)
      setError(null)
      setSuccess(null)
      await login()
    } catch (error) {
      console.error('Login failed:', error)
      setError('Failed to start connection process. Please try again.')
      setIsConnecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <BarChart3 className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Pipeline Pulse</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your Zoho CRM data into actionable revenue insights
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="p-6">
              <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">O2R Tracking</h3>
              <p className="text-sm text-gray-600">Track opportunities from creation to revenue realization</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-6">
              <Globe className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Global Analytics</h3>
              <p className="text-sm text-gray-600">Country-wise pipeline analysis with drill-down capabilities</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-6">
              <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Real-time Sync</h3>
              <p className="text-sm text-gray-600">Live data synchronization with your Zoho CRM</p>
            </CardContent>
          </Card>
        </div>

        {/* Login Card */}
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <ExternalLink className="h-5 w-5" />
              <span>Connect to Zoho CRM</span>
            </CardTitle>
            <CardDescription>
              Sign in with your Zoho CRM account to access Pipeline Pulse
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Success Message */}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Login Button */}
            <Button 
              onClick={handleLogin} 
              disabled={isConnecting}
              className="w-full h-12"
              size="lg"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting to Zoho CRM...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-5 w-5" />
                  Sign in with Zoho CRM
                </>
              )}
            </Button>

            {/* Help Text */}
            <div className="text-xs text-gray-500 space-y-2 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">How it works:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Click "Sign in with Zoho CRM" to start the secure OAuth flow</li>
                <li>You'll be redirected to Zoho to log in and grant permissions</li>
                <li>Once connected, you'll have full access to Pipeline Pulse features</li>
                <li>Your connection is secure and can be managed from the settings</li>
              </ul>
            </div>

            {/* Data Center Info */}
            <div className="text-xs text-center text-gray-500 border-t pt-4">
              <p>Connecting to Zoho CRM India Data Center</p>
              <p className="text-gray-400">accounts.zoho.in</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2024 1CloudHub. Pipeline Pulse - Opportunity to Revenue Tracker</p>
        </div>
      </div>
    </div>
  )
}
