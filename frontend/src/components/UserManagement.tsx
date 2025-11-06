import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import * as api from '../../lib/api'

export function UserManagement() {
  const { user } = useAuth()
  const [users, setUsers] = useState<api.User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    full_name: '',
    password: '',
    hospital_name: '',
    specialization: '',
    role: 'doctor' as 'admin' | 'doctor' | 'radiologist'
  })

  // Check if current user is admin
  const isAdmin = user?.role === 'admin'

  React.useEffect(() => {
    if (isAdmin) {
      loadUsers()
    }
  }, [isAdmin])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${api.API_BASE}/api/users/`, {
        headers: {
          'Authorization': `Bearer ${api.getToken()}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await api.register(newUser)
      setShowAddUser(false)
      setNewUser({
        email: '',
        username: '',
        full_name: '',
        password: '',
        hospital_name: '',
        specialization: '',
        role: 'doctor'
      })
      loadUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeactivate = async (userId: number) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return

    try {
      const response = await fetch(`${api.API_BASE}/api/users/${userId}/deactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${api.getToken()}`
        }
      })
      if (response.ok) {
        loadUsers()
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleActivate = async (userId: number) => {
    try {
      const response = await fetch(`${api.API_BASE}/api/users/${userId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${api.getToken()}`
        }
      })
      if (response.ok) {
        loadUsers()
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return

    try {
      const response = await fetch(`${api.API_BASE}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${api.getToken()}`
        }
      })
      if (response.ok) {
        loadUsers()
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You don't have permission to access user management.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>User Management</h2>
        <button
          onClick={() => setShowAddUser(!showAddUser)}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 600
          }}
        >
          {showAddUser ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fee', color: '#c33', borderRadius: '8px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {showAddUser && (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3>Add New User</h3>
          <form onSubmit={handleAddUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email *</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Username *</label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Full Name *</label>
              <input
                type="text"
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Password *</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
                minLength={8}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Hospital</label>
              <input
                type="text"
                value={newUser.hospital_name}
                onChange={(e) => setNewUser({ ...newUser, hospital_name: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Specialization</label>
              <input
                type="text"
                value={newUser.specialization}
                onChange={(e) => setNewUser({ ...newUser, specialization: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Role *</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ddd' }}
              >
                <option value="doctor">Doctor</option>
                <option value="radiologist">Radiologist</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button
                type="submit"
                style={{
                  padding: '0.75rem 2rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading users...</div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Role</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Hospital</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 500 }}>{u.full_name}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>@{u.username}</div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{u.email}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: u.role === 'admin' ? '#fef3c7' : u.role === 'radiologist' ? '#dbeafe' : '#d1fae5',
                      color: u.role === 'admin' ? '#92400e' : u.role === 'radiologist' ? '#1e40af' : '#065f46'
                    }}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{u.hospital_name || '-'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: u.is_active ? '#d1fae5' : '#fee2e2',
                      color: u.is_active ? '#065f46' : '#991b1b'
                    }}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {u.is_active ? (
                        <button
                          onClick={() => handleDeactivate(u.id)}
                          disabled={u.id === user?.id}
                          style={{
                            padding: '0.5rem 1rem',
                            background: u.id === user?.id ? '#e9ecef' : '#fef3c7',
                            color: u.id === user?.id ? '#6c757d' : '#92400e',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: u.id === user?.id ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(u.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#d1fae5',
                            color: '#065f46',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={u.id === user?.id}
                        style={{
                          padding: '0.5rem 1rem',
                          background: u.id === user?.id ? '#e9ecef' : '#fee2e2',
                          color: u.id === user?.id ? '#6c757d' : '#991b1b',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: u.id === user?.id ? 'not-allowed' : 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6c757d' }}>
              No users found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
