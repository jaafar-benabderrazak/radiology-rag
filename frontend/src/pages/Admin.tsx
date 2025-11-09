import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  fetchAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  type TemplateDetail,
  type TemplateCreateRequest,
  type TemplateUpdateRequest
} from '../lib/api'

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [templates, setTemplates] = useState<TemplateDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TemplateDetail | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState<TemplateCreateRequest>({
    template_id: '',
    title: '',
    keywords: [],
    skeleton: '',
    category: '',
    language: 'fr',
    is_active: true,
    is_shared: false
  })

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/')
    }
  }, [user, authLoading, navigate])

  // Load templates
  useEffect(() => {
    if (user && user.role === 'admin') {
      loadTemplates()
    }
  }, [user])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAllTemplates()
      setTemplates(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingTemplate(null)
    setFormData({
      template_id: '',
      title: '',
      keywords: [],
      skeleton: '',
      category: '',
      language: 'fr',
      is_active: true,
      is_shared: false
    })
    setShowModal(true)
  }

  const handleEdit = (template: TemplateDetail) => {
    setEditingTemplate(template)
    setFormData({
      template_id: template.template_id,
      title: template.title,
      keywords: template.keywords,
      skeleton: template.skeleton,
      category: template.category || '',
      language: template.language || 'fr',
      is_active: template.is_active,
      is_shared: template.is_shared
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      if (editingTemplate) {
        // Update existing template
        const updateData: TemplateUpdateRequest = {
          title: formData.title,
          keywords: formData.keywords,
          skeleton: formData.skeleton,
          category: formData.category || null,
          language: formData.language,
          is_active: formData.is_active,
          is_shared: formData.is_shared
        }
        await updateTemplate(editingTemplate.template_id, updateData)
      } else {
        // Create new template
        await createTemplate(formData)
      }

      setShowModal(false)
      await loadTemplates()
    } catch (err: any) {
      setError(err.message || 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to deactivate this template?')) {
      return
    }

    try {
      setError(null)
      await deleteTemplate(templateId)
      await loadTemplates()
    } catch (err: any) {
      setError(err.message || 'Failed to delete template')
    }
  }

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = !searchTerm ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.template_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = showInactive || t.is_active

    return matchesSearch && matchesStatus
  })

  if (authLoading || loading) {
    return (
      <div className="admin-container">
        <div className="loading-state">Loading...</div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1 className="admin-title">Template Management</h1>
            <p className="admin-subtitle">Manage radiology report templates</p>
          </div>
          <button className="btn btn-back" onClick={() => navigate('/')}>
            ← Back to Reports
          </button>
        </div>
      </header>

      <main className="admin-main">
        {error && (
          <div className="error-box">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="admin-toolbar">
          <div className="admin-search">
            <input
              type="text"
              placeholder="Search templates..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="admin-filters">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              Show inactive templates
            </label>
          </div>

          <button className="btn btn-primary" onClick={handleCreate}>
            + New Template
          </button>
        </div>

        <div className="templates-grid">
          {filteredTemplates.map((template) => (
            <div key={template.id} className={`template-card ${!template.is_active ? 'inactive' : ''}`}>
              <div className="template-card-header">
                <h3 className="template-card-title">{template.title}</h3>
                <div className="template-card-badges">
                  {template.is_system_template ? (
                    <span className="badge badge-system">SYSTEM</span>
                  ) : (
                    <span className="badge badge-user">USER</span>
                  )}
                  {template.is_shared && (
                    <span className="badge badge-shared">SHARED</span>
                  )}
                  {template.category && (
                    <span className="badge badge-category">{template.category}</span>
                  )}
                  {template.language && (
                    <span className="badge badge-language">{template.language.toUpperCase()}</span>
                  )}
                  {!template.is_active && (
                    <span className="badge badge-inactive">INACTIVE</span>
                  )}
                </div>
              </div>

              <div className="template-card-body">
                <p className="template-id">ID: {template.template_id}</p>
                <div className="template-keywords">
                  {template.keywords.slice(0, 5).map((keyword, idx) => (
                    <span key={idx} className="keyword-tag">{keyword}</span>
                  ))}
                  {template.keywords.length > 5 && (
                    <span className="keyword-tag">+{template.keywords.length - 5} more</span>
                  )}
                </div>
                <p className="template-dates">
                  Created: {new Date(template.created_at).toLocaleDateString()}
                  {template.updated_at && ` • Updated: ${new Date(template.updated_at).toLocaleDateString()}`}
                </p>
              </div>

              <div className="template-card-actions">
                <button
                  className="btn btn-edit"
                  onClick={() => handleEdit(template)}
                >
                  Edit
                </button>
                {template.is_active && (
                  <button
                    className="btn btn-delete"
                    onClick={() => handleDelete(template.template_id)}
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="empty-state">
            <p>No templates found</p>
          </div>
        )}
      </main>

      {/* Template Editor Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTemplate ? 'Edit Template' : 'Create New Template'}</h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="label">Template ID *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.template_id}
                  onChange={(e) => setFormData({...formData, template_id: e.target.value})}
                  disabled={!!editingTemplate}
                  placeholder="e.g., ct_chest_pe"
                />
                {editingTemplate && (
                  <p className="help-text">Template ID cannot be changed</p>
                )}
              </div>

              <div className="form-group">
                <label className="label">Title *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g., CT Chest - Pulmonary Embolism"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label">Category</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="e.g., CT, MRI, X-Ray"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Language</label>
                  <select
                    className="select"
                    value={formData.language}
                    onChange={(e) => setFormData({...formData, language: e.target.value})}
                  >
                    <option value="fr">French (fr)</option>
                    <option value="en">English (en)</option>
                    <option value="ar">Arabic (ar)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Keywords * (comma-separated)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.keywords.join(', ')}
                  onChange={(e) => setFormData({
                    ...formData,
                    keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                  })}
                  placeholder="e.g., ct, chest, pulmonary embolism, pe"
                />
              </div>

              <div className="form-group">
                <label className="label">Template Skeleton *</label>
                <textarea
                  className="textarea"
                  value={formData.skeleton}
                  onChange={(e) => setFormData({...formData, skeleton: e.target.value})}
                  placeholder="Enter the report template structure..."
                  rows={15}
                  style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                />
                <p className="help-text">
                  Use placeholders like &lt;fill&gt;, &lt;à remplir&gt; for AI to fill in
                </p>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  Active
                </label>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_shared}
                    onChange={(e) => setFormData({...formData, is_shared: e.target.checked})}
                  />
                  Share with all users
                </label>
                <p className="help-text">
                  When shared, this template will be available to all users in the system
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || !formData.template_id || !formData.title || formData.keywords.length === 0 || !formData.skeleton}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-container {
          min-height: 100vh;
          background: #f7fafc;
        }

        .admin-header {
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .admin-header-content {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .admin-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 0.5rem;
        }

        .admin-subtitle {
          color: #718096;
        }

        .admin-main {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem 4rem;
        }

        .admin-toolbar {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .admin-search {
          flex: 1;
          min-width: 250px;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .admin-filters {
          display: flex;
          gap: 1rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          user-select: none;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .template-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: all 0.2s;
        }

        .template-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .template-card.inactive {
          opacity: 0.6;
          background: #f7fafc;
        }

        .template-card-header {
          margin-bottom: 1rem;
        }

        .template-card-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.5rem;
        }

        .template-card-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .badge-system {
          background: #e9d8fd;
          color: #553c9a;
        }

        .badge-user {
          background: #fef5e7;
          color: #975a16;
        }

        .badge-shared {
          background: #b2dfdb;
          color: #00695c;
        }

        .badge-category {
          background: #bee3f8;
          color: #2c5282;
        }

        .badge-language {
          background: #c6f6d5;
          color: #22543d;
        }

        .badge-inactive {
          background: #fed7d7;
          color: #c53030;
        }

        .template-card-body {
          margin-bottom: 1rem;
        }

        .template-id {
          font-family: monospace;
          font-size: 0.85rem;
          color: #718096;
          margin-bottom: 0.5rem;
        }

        .template-keywords {
          display: flex;
          gap: 0.25rem;
          flex-wrap: wrap;
          margin-bottom: 0.75rem;
        }

        .keyword-tag {
          background: #edf2f7;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          color: #4a5568;
        }

        .template-dates {
          font-size: 0.75rem;
          color: #a0aec0;
        }

        .template-card-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: #e2e8f0;
          color: #4a5568;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #cbd5e0;
        }

        .btn-back {
          background: white;
          border: 2px solid #e2e8f0;
          color: #4a5568;
        }

        .btn-back:hover {
          border-color: #cbd5e0;
          background: #f7fafc;
        }

        .btn-edit {
          flex: 1;
          background: #4299e1;
          color: white;
        }

        .btn-edit:hover {
          background: #3182ce;
        }

        .btn-delete {
          flex: 1;
          background: #fc8181;
          color: white;
        }

        .btn-delete:hover {
          background: #f56565;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #2d3748;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 2rem;
          color: #a0aec0;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          color: #4a5568;
        }

        .modal-body {
          padding: 1.5rem;
          overflow-y: auto;
        }

        .modal-footer {
          padding: 1.5rem;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .label {
          display: block;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 0.5rem;
          font-size: 0.95rem;
        }

        .input, .select, .textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .input:focus, .select:focus, .textarea:focus {
          outline: none;
          border-color: #667eea;
        }

        .textarea {
          resize: vertical;
          min-height: 150px;
        }

        .help-text {
          margin-top: 0.5rem;
          font-size: 0.85rem;
          color: #718096;
        }

        .error-box {
          background: #fff5f5;
          border-left: 4px solid #f56565;
          padding: 1rem;
          border-radius: 4px;
          color: #c53030;
          margin-bottom: 1.5rem;
        }

        .loading-state, .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #a0aec0;
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  )
}
