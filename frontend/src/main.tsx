import React from 'react'
import ReactDOM from 'react-dom/client'
import MainApp from './MainApp'
import { AuthProvider } from './contexts/AuthContext'
import { AuthWrapper } from './components/auth/AuthWrapper'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <AuthWrapper>
        <MainApp />
      </AuthWrapper>
    </AuthProvider>
  </React.StrictMode>,
)
