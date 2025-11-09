import React from 'react'
import ReactDOM from 'react-dom/client'
import MainApp from './MainApp'
import { AuthProvider } from './contexts/AuthContext'
<<<<<<< HEAD
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthWrapper } from './components/auth/AuthWrapper'
import './styles/global.css'
=======
import './index.css'
>>>>>>> claude/admin-template-management-011CUtvK2niZyDKTAoaDcdRp

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
<<<<<<< HEAD
      <ThemeProvider>
        <AuthWrapper>
          <MainApp />
        </AuthWrapper>
      </ThemeProvider>
=======
      <App />
>>>>>>> claude/admin-template-management-011CUtvK2niZyDKTAoaDcdRp
    </AuthProvider>
  </React.StrictMode>,
)
