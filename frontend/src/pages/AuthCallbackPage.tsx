import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { Loader2, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { handleLoginSuccess, setLoading } = useAuthStore()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log('Starting auth callback processing...')
        console.log('Current URL params:', Object.fromEntries(searchParams.entries()))
        
        setLoading(true)
        
        // Check for error parameters first
        const error = searchParams.get('error')
        if (error) {
          console.error('OAuth error detected:', error)
          console.error('Error message:', searchParams.get('message'))
          
          let errorMessage = 'Authentication failed'
          
          switch (error) {
            case 'oauth_error':
              errorMessage = `OAuth authentication failed: ${searchParams.get('message') || 'Unknown error'}. Please try logging in again.`
              break
            case 'missing_params':
              errorMessage = 'Missing required authentication parameters. Please try logging in again.'
              break
            case 'invalid_state':
              errorMessage = 'Security validation failed. Please try logging in again for your safety.'
              break
            case 'callback_failed':
              errorMessage = `Authentication process failed: ${searchParams.get('message') || 'Unknown error'}. Please try again.`
              break
            case 'access_denied':
              errorMessage = 'Access was denied. Please grant the necessary permissions and try again.'
              break
            default:
              errorMessage = `Authentication error (${error}). Please try logging in again.`
          }
          
          setStatus('error')
          setMessage(errorMessage)
          return
        }

        // Check for JWT token
        const token = searchParams.get('token')
        
        // Debug logging for JWT token
        console.log('Received JWT token:', token)
        console.log('Token length:', token?.length)
        
        if (!token) {
          console.error('No JWT token found in URL parameters')
          setStatus('error')
          setMessage('No authentication token received. Please try logging in again.')
          return
        }

        if (token.length < 20) {
          console.error('JWT token appears to be too short:', token.length)
          setStatus('error')
          setMessage('Invalid authentication token format. Please try logging in again.')
          return
        }

        // Basic JWT format validation (should have 3 parts separated by dots)
        const tokenParts = token.split('.')
        if (tokenParts.length !== 3) {
          console.error('JWT token format is invalid - expected 3 parts, got:', tokenParts.length)
          setStatus('error')
          setMessage('Invalid authentication token structure. Please try logging in again.')
          return
        }

        // Check if token parts are base64 encoded (basic validation)
        try {
          // Try to decode the header and payload to verify basic structure
          const header = JSON.parse(atob(tokenParts[0]))
          const payload = JSON.parse(atob(tokenParts[1]))
          
          console.log('JWT header:', header)
          console.log('JWT payload preview:', { 
            sub: payload.sub, 
            exp: payload.exp, 
            iat: payload.iat,
            user_id: payload.user_id
          })
          
          // Check if token has required claims
          if (!payload.sub || !payload.user_id) {
            console.error('JWT token missing required claims')
            setStatus('error')
            setMessage('Authentication token is missing required user information. Please try logging in again.')
            return
          }
          
        } catch (decodeError) {
          console.error('Failed to decode JWT token:', decodeError)
          setStatus('error')
          setMessage('Authentication token is corrupted or invalid. Please try logging in again.')
          return
        }

        // Process the JWT token
        console.log('Processing JWT token through handleLoginSuccess...')
        await handleLoginSuccess(token)
        console.log('JWT token processed successfully')
        
        console.log('Authentication successful, setting success status')
        setStatus('success')
        setMessage('Successfully authenticated! Redirecting to dashboard...')
        
        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          console.log('Redirecting to dashboard...')
          navigate('/', { replace: true })
        }, 2000)
        
      } catch (error: unknown) {
        console.error('Auth callback processing failed:', error)
        
        // Provide more specific error messages based on error type
        let errorMessage = 'Failed to process authentication. Please try again.'
        
        if (error instanceof Error) {
          if (error.message.includes('Token is expired')) {
            errorMessage = 'Your authentication token has expired. Please log in again.'
          } else if (error.message.includes('Invalid token')) {
            errorMessage = 'Invalid authentication token. Please try logging in again.'
          } else if (error.message.includes('Network')) {
            errorMessage = 'Network error occurred. Please check your connection and try again.'
          } else if (error.message.includes('fetch')) {
            errorMessage = 'Unable to connect to the server. Please try again later.'
          } else {
            errorMessage = `Authentication failed: ${error.message}`
          }
        }
        
        setStatus('error')
        setMessage(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    processCallback()
  }, [searchParams, navigate, handleLoginSuccess, setLoading])

  const handleRetry = () => {
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <CardTitle className="text-2xl">Pipeline Pulse</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'processing' && (
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <h3 className="text-lg font-semibold">Processing Authentication</h3>
              <p className="text-gray-600">
                Please wait while we verify your Zoho CRM credentials...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-8 w-8 mx-auto text-green-600" />
              <h3 className="text-lg font-semibold text-green-800">Authentication Successful!</h3>
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {message}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <AlertCircle className="h-8 w-8 mx-auto text-red-600" />
              <h3 className="text-lg font-semibold text-red-800">Authentication Failed</h3>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {message}
                </AlertDescription>
              </Alert>
              <Button 
                onClick={handleRetry} 
                className="w-full"
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
