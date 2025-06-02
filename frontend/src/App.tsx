import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import SAMLCallback from '@/components/auth/SAMLCallback'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Upload from '@/pages/Upload'
import Analysis from '@/pages/Analysis'
import CRMSync from '@/pages/CRMSync'
import O2RDashboard from '@/pages/O2RDashboard'
import O2ROpportunities from '@/pages/O2ROpportunities'
import BulkUpdate from '@/pages/BulkUpdate'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Routes>
          {/* SAML callback route - outside of ProtectedRoute */}
          <Route path="/auth/callback" element={<SAMLCallback />} />

          {/* Protected routes */}
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/upload" element={<Upload />} />
                  <Route path="/analysis/:id" element={<Analysis />} />
                  <Route path="/crm-sync" element={<CRMSync />} />
                  <Route path="/o2r" element={<O2RDashboard />} />
                  <Route path="/o2r/opportunities" element={<O2ROpportunities />} />
                  <Route path="/bulk-update" element={<BulkUpdate />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
        <Toaster />
      </div>
    </AuthProvider>
  )
}

export default App
