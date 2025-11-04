import { useState } from 'react'
import App from './App'
import ReportHistory from './components/ReportHistory'
import TemplateBuilder from './components/TemplateBuilder'
import { getCurrentUser, type User } from './lib/api'
import { useEffect } from 'react'

type View = 'generator' | 'history' | 'templates'

export default function MainApp() {
  const [currentView, setCurrentView] = useState<View>('generator')
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Try to load current user if authenticated
    getCurrentUser()
      .then(setUser)
      .catch(() => {
        // Not authenticated or error - that's OK, continue without user
        console.log('No authenticated user')
      })
  }, [])

  return (
    <div className="main-app">
      {/* Navigation Bar */}
      <nav className="main-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <h1 className="nav-title">Radiology AI Suite</h1>
            {user && (
              <span className="user-badge">
                {user.full_name} • {user.role}
              </span>
            )}
          </div>
          <div className="nav-links">
            <button
              className={`nav-link ${currentView === 'generator' ? 'active' : ''}`}
              onClick={() => setCurrentView('generator')}
            >
              📝 Report Generator
            </button>
            <button
              className={`nav-link ${currentView === 'history' ? 'active' : ''}`}
              onClick={() => setCurrentView('history')}
            >
              📚 Report History
            </button>
            <button
              className={`nav-link ${currentView === 'templates' ? 'active' : ''}`}
              onClick={() => setCurrentView('templates')}
            >
              🔧 Template Builder
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-content-wrapper">
        {currentView === 'generator' && <App />}
        {currentView === 'history' && <ReportHistory />}
        {currentView === 'templates' && <TemplateBuilder />}
      </div>

      <style>{`
        .main-app {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .main-nav {
          background: rgba(255, 255, 255, 0.98);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
        }

        @media (max-width: 768px) {
          .nav-container {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }

        .nav-brand {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .nav-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a202c;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .user-badge {
          font-size: 0.85rem;
          color: #718096;
          font-weight: 500;
        }

        .nav-links {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .nav-link {
          padding: 0.75rem 1.5rem;
          background: transparent;
          border: 2px solid transparent;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          color: #4a5568;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .nav-link:hover {
          background: #f7fafc;
          color: #667eea;
        }

        .nav-link.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }

        .main-content-wrapper {
          min-height: calc(100vh - 100px);
        }
      `}</style>
    </div>
  )
}
