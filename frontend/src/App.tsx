<<<<<<< HEAD
import { useState, useEffect } from "react"
import {
  fetchTemplates,
  generate,
  downloadReportWord,
  downloadReportPDF,
  generateSummary,
  validateReport,
  type Template,
  type GenerateResponse,
  type SummaryResult,
  type ValidationResult
} from "./lib/api"
// Language interface
type Language = 'en' | 'fr'
=======
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Landing from './pages/Landing'
import ReportGenerator from './pages/ReportGenerator'
import ReportHistory from './pages/ReportHistory'
import Admin from './pages/Admin'

// Product pages
import Features from './pages/product/Features'
import HowItWorks from './pages/product/HowItWorks'
import Pricing from './pages/product/Pricing'
>>>>>>> claude/admin-template-management-011CUtvK2niZyDKTAoaDcdRp

// Company pages
import About from './pages/company/About'
import Contact from './pages/company/Contact'
import Careers from './pages/company/Careers'

// Legal pages
import Privacy from './pages/legal/Privacy'
import Terms from './pages/legal/Terms'
import HIPAA from './pages/legal/HIPAA'

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontSize: '1.2rem',
        color: '#667eea'
      }}>
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        {/* Product pages */}
        <Route path="/product/features" element={<Features />} />
        <Route path="/product/how-it-works" element={<HowItWorks />} />
        <Route path="/product/pricing" element={<Pricing />} />

        {/* Company pages */}
        <Route path="/company/about" element={<About />} />
        <Route path="/company/contact" element={<Contact />} />
        <Route path="/company/careers" element={<Careers />} />

        {/* Legal pages */}
        <Route path="/legal/privacy" element={<Privacy />} />
        <Route path="/legal/terms" element={<Terms />} />
        <Route path="/legal/hipaa" element={<HIPAA />} />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <ReportGenerator />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <ReportHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        {/* Redirect old routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
