import React from 'react'
import ReactDOM from 'react-dom/client'
import MainApp from './MainApp'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthWrapper } from './components/auth/AuthWrapper'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <AuthWrapper>
          <MainApp />
        </AuthWrapper>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>,
)
