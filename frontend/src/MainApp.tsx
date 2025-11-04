import { useState, useEffect } from 'react'
import App from './App'
import ReportHistory from './components/ReportHistory'
import TemplateBuilder from './components/TemplateBuilder'
import { getCurrentUser, type User } from './lib/api'

type View = 'generator' | 'history' | 'templates'

export default function MainApp() {
  const [currentView, setCurrentView] = useState<View>('generator')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Try to load current user if authenticated
    setLoading(true)
    getCurrentUser()
      .then(user => {
        setUser(user)
        setError(null)
      })
      .catch((err) => {
        // Not authenticated or error - that's OK, continue without user
        console.log('No authenticated user:', err.message)
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="main-app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading Radiology AI Suite...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="main-app">
      {/* Navigation Bar */}
      <nav className="main-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <div className="nav-title-wrapper">
              <span className="nav-icon">🏥</span>
              <h1 className="nav-title">Radiology AI Suite</h1>
            </div>
            {user && (
              <div className="user-info">
                <span className="user-avatar">{user.full_name.charAt(0)}</span>
                <div className="user-details">
                  <span className="user-name">{user.full_name}</span>
                  <span className="user-role">{user.role}</span>
                </div>
              </div>
            )}
          </div>
          <div className="nav-links">
            <button
              className={`nav-link ${currentView === 'generator' ? 'active' : ''}`}
              onClick={() => setCurrentView('generator')}
              aria-label="Report Generator"
            >
              <span className="nav-link-icon">📝</span>
              <span className="nav-link-text">Report Generator</span>
            </button>
            <button
              className={`nav-link ${currentView === 'history' ? 'active' : ''}`}
              onClick={() => setCurrentView('history')}
              aria-label="Report History"
            >
              <span className="nav-link-icon">📚</span>
              <span className="nav-link-text">Report History</span>
            </button>
            <button
              className={`nav-link ${currentView === 'templates' ? 'active' : ''}`}
              onClick={() => setCurrentView('templates')}
              aria-label="Template Builder"
            >
              <span className="nav-link-icon">🔧</span>
              <span className="nav-link-text">Template Builder</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-content-wrapper">
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button className="error-close" onClick={() => setError(null)}>✕</button>
          </div>
        )}
        {currentView === 'generator' && <App />}
        {currentView === 'history' && <ReportHistory />}
        {currentView === 'templates' && <TemplateBuilder />}
      </div>

      <style>{`
        .main-app {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          gap: 1.5rem;
        }

        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-text {
          color: white;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .main-nav {
          background: rgba(255, 255, 255, 0.98);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(10px);
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

        @media (max-width: 968px) {
          .nav-container {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .nav-links {
            width: 100%;
          }

          .nav-link {
            flex: 1;
            justify-content: center;
          }
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .nav-title-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .nav-icon {
          font-size: 2rem;
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

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          border-radius: 50px;
          border: 2px solid #e2e8f0;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }

        .user-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #2d3748;
        }

        .user-role {
          font-size: 0.75rem;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.5px;
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
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          color: #4a5568;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .nav-link-icon {
          font-size: 1.2rem;
          transition: transform 0.3s ease;
        }

        .nav-link:hover {
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }

        .nav-link:hover .nav-link-icon {
          transform: scale(1.2);
        }

        .nav-link.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .nav-link.active .nav-link-icon {
          transform: scale(1.1);
        }

        .main-content-wrapper {
          min-height: calc(100vh - 100px);
          position: relative;
        }

        .error-banner {
          position: sticky;
          top: 80px;
          z-index: 50;
          background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
          color: #742a2a;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 1rem;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(254, 178, 178, 0.5);
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .error-icon {
          font-size: 1.5rem;
        }

        .error-close {
          margin-left: auto;
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #742a2a;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .error-close:hover {
          opacity: 1;
        }

        @media (max-width: 640px) {
          .nav-title {
            font-size: 1.2rem;
          }

          .nav-link-text {
            display: none;
          }

          .nav-link {
            padding: 0.75rem;
          }

          .nav-link-icon {
            font-size: 1.5rem;
          }

          .user-details {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
