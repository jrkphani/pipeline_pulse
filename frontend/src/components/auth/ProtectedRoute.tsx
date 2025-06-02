import React, { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, LogIn, Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const { isAuthenticated, isLoading, login, user } = useAuth()

  useEffect(() => {
    // If not loading and not authenticated, could auto-redirect
    // For now, we'll show the login UI
  }, [isAuthenticated, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold mb-2">Loading...</h2>
            <p className="text-gray-600">Checking authentication status</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <Shield className="h-16 w-16 mx-auto mb-4 text-blue-600" />
              <h1 className="text-2xl font-bold mb-2">Pipeline Pulse</h1>
              <p className="text-gray-600">
                Please sign in with your Zoho Directory account to access the application.
              </p>
            </div>
            
            <Button 
              onClick={() => login(window.location.pathname)}
              className="w-full"
              size="lg"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign in with Zoho Directory
            </Button>
            
            <div className="mt-6 text-sm text-gray-500">
              <p>Secure authentication powered by Zoho Directory</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}

export default ProtectedRoute
