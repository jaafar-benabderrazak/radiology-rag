import React from 'react'
import { useAuth } from '../contexts/AuthContext'

export function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = React.useState({
    reportsToday: 0,
    reportsThisWeek: 0,
    reportsTotal: 0
  })

  React.useEffect(() => {
    // Fetch user stats
    // This would call an API endpoint to get user statistics
    setStats({
      reportsToday: 5,
      reportsThisWeek: 23,
      reportsTotal: 147
    })
  }, [])

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '2rem' }}>Dashboard</h2>

      {/* Welcome Card */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
      }}>
        <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>Welcome back, {user?.full_name}!</h3>
        <p style={{ margin: 0, opacity: 0.9 }}>
          {user?.hospital_name || 'Radiology System'} · {user?.specialization || user?.role}
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem' }}>Reports Today</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#667eea' }}>{stats.reportsToday}</div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem' }}>This Week</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>{stats.reportsThisWeek}</div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '0.5rem' }}>Total Reports</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>{stats.reportsTotal}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0 }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <button style={{
            padding: '1rem',
            background: '#f8f9fa',
            border: '2px solid #e9ecef',
            borderRadius: '8px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s'
          }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.background = '#f0f4ff' }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e9ecef'; e.currentTarget.style.background = '#f8f9fa' }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📝</div>
            <div style={{ fontWeight: 600 }}>New Report</div>
            <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>Generate new radiology report</div>
          </button>

          <button style={{
            padding: '1rem',
            background: '#f8f9fa',
            border: '2px solid #e9ecef',
            borderRadius: '8px',
            cursor: 'pointer',
            textAlign: 'left'
          }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.background = '#f0f4ff' }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e9ecef'; e.currentTarget.style.background = '#f8f9fa' }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</div>
            <div style={{ fontWeight: 600 }}>View History</div>
            <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>See past reports</div>
          </button>

          <button style={{
            padding: '1rem',
            background: '#f8f9fa',
            border: '2px solid #e9ecef',
            borderRadius: '8px',
            cursor: 'pointer',
            textAlign: 'left'
          }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.background = '#f0f4ff' }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e9ecef'; e.currentTarget.style.background = '#f8f9fa' }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚙️</div>
            <div style={{ fontWeight: 600 }}>Settings</div>
            <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>Update profile & preferences</div>
          </button>

          {user?.role === 'admin' && (
            <button style={{
              padding: '1rem',
              background: '#f8f9fa',
              border: '2px solid #e9ecef',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.background = '#f0f4ff' }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e9ecef'; e.currentTarget.style.background = '#f8f9fa' }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>👥</div>
              <div style={{ fontWeight: 600 }}>User Management</div>
              <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>Manage users & permissions</div>
            </button>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginTop: '2rem' }}>
        <h3 style={{ marginTop: 0 }}>Recent Activity</h3>
        <div style={{ fontSize: '0.875rem', color: '#6c757d', padding: '3rem 0', textAlign: 'center' }}>
          No recent activity
        </div>
      </div>
    </div>
  )
}
