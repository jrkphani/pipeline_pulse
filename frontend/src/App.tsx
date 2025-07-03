import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/AuthContext'
import { NavigationProvider } from '@/contexts/NavigationContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Navigation } from '@/components/navigation/Navigation'
import Dashboard from '@/pages/Dashboard'
import Analysis from '@/pages/Analysis'
import CRMSync from '@/pages/CRMSync'
import O2RDashboard from '@/pages/O2RDashboard'
import O2ROpportunities from '@/pages/O2ROpportunities'
import { LiveSync } from '@/pages/LiveSync'
import { SyncStatus } from '@/pages/SyncStatus'
import LoginPage from '@/pages/LoginPage'

function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Public route for OAuth callback */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes - require OAuth authentication */}
            <Route path="/*" element={
              <ProtectedRoute>
                <Navigation>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/analysis/:id" element={<Analysis />} />
                    <Route path="/crm-sync" element={<CRMSync />} />
                    <Route path="/live-sync" element={<LiveSync />} />
                    <Route path="/sync-status" element={<SyncStatus />} />
                    <Route path="/o2r" element={<O2RDashboard />} />
                    <Route path="/o2r/opportunities" element={<O2ROpportunities />} />
                  </Routes>
                </Navigation>
              </ProtectedRoute>
            } />
          </Routes>
          <Toaster />
        </div>
      </NavigationProvider>
    </AuthProvider>
  )
}

export default App
