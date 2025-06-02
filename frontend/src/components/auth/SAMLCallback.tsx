import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

const SAMLCallback: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Processing authentication...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get token from URL parameters
        const token = searchParams.get('token')
        const error = searchParams.get('error')
        
        if (error) {
          setStatus('error')
          setMessage(`Authentication failed: ${error}`)
          setTimeout(() => navigate('/'), 3000)
          return
        }

        if (!token) {
          setStatus('error')
          setMessage('No authentication token received')
          setTimeout(() => navigate('/'), 3000)
          return
        }

        // Verify the token with the backend
        const response = await fetch('/api/auth/verify-token', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        const result = await response.json()

        if (result.valid) {
          // Store token and user info
          localStorage.setItem('auth_token', token)
          localStorage.setItem('user_info', JSON.stringify(result.user))
          
          setStatus('success')
          setMessage('Authentication successful! Redirecting...')
          
          // Redirect to dashboard or original destination
          const redirectTo = searchParams.get('relay_state') || '/'
          setTimeout(() => {
            window.location.href = redirectTo
          }, 1500)
        } else {
          setStatus('error')
          setMessage('Invalid authentication token')
          setTimeout(() => navigate('/'), 3000)
        }

      } catch (error) {
        console.error('SAML callback error:', error)
        setStatus('error')
        setMessage('Authentication processing failed')
        setTimeout(() => navigate('/'), 3000)
      }
    }

    handleCallback()
  }, [searchParams, navigate])

  const getIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-600" />
      case 'error':
        return <XCircle className="h-12 w-12 text-red-600" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'text-blue-600'
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            {getIcon()}
            <h1 className="text-2xl font-bold mb-2 mt-4">Pipeline Pulse</h1>
            <p className={`text-lg font-medium ${getStatusColor()}`}>
              {status === 'processing' && 'Authenticating...'}
              {status === 'success' && 'Welcome!'}
              {status === 'error' && 'Authentication Failed'}
            </p>
          </div>
          
          <p className="text-gray-600 mb-4">
            {message}
          </p>

          {status === 'processing' && (
            <div className="text-sm text-gray-500">
              <p>Please wait while we complete your sign-in...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-sm text-gray-500">
              <p>You will be redirected to the dashboard shortly.</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-sm text-gray-500">
              <p>You will be redirected to the login page shortly.</p>
              <p className="mt-2">
                If this problem persists, please contact your administrator.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default SAMLCallback
