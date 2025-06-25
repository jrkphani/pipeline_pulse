import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Analysis from '@/pages/Analysis'
import CRMSync from '@/pages/CRMSync'
import O2RDashboard from '@/pages/O2RDashboard'
import O2ROpportunities from '@/pages/O2ROpportunities'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/analysis/:id" element={<Analysis />} />
              <Route path="/crm-sync" element={<CRMSync />} />
              <Route path="/o2r" element={<O2RDashboard />} />
              <Route path="/o2r/opportunities" element={<O2ROpportunities />} />
              {/* Removed upload and bulk-update routes */}
            </Routes>
          </Layout>
        </ProtectedRoute>
        <Toaster />
      </div>
    </AuthProvider>
  )
}

export default App
