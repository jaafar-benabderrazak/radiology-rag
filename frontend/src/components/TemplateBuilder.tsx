import { useState, useEffect } from 'react'
import type { TemplateResponse, TemplateCreate, TemplateUpdate } from '../lib/api'
import * as api from '../lib/api'

export default function TemplateBuilder() {
  const [templates, setTemplates] = useState<TemplateResponse[]>([])
  const [myTemplates, setMyTemplates] = useState<TemplateResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'all' | 'my'>('all')

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TemplateResponse | null>(null)
  const [formData, setFormData] = useState<TemplateCreate>({
    title: '',
    keywords: [],
    skeleton: '',
    category: '',
    is_shared: false
  })
  const [keywordInput, setKeywordInput] = useState('')

  useEffect(() => {
    loadTemplates()
  }, [view])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      if (view === 'all') {
        const data = await api.fetchAllTemplates()
        setTemplates(data)
      } else {
        const data = await api.fetchMyTemplates()
        setMyTemplates(data)
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
      alert('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const openCreateForm = () => {
    setEditingTemplate(null)
    setFormData({
      title: '',
      keywords: [],
      skeleton: '',
      category: '',
      is_shared: false
    })
    setKeywordInput('')
    setShowForm(true)
  }

  const openEditForm = (template: TemplateResponse) => {
    setEditingTemplate(template)
    setFormData({
      title: template.title,
      keywords: template.keywords,
      skeleton: template.skeleton,
      category: template.category || '',
      is_shared: template.is_shared
    })
    setKeywordInput('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingTemplate(null)
    setFormData({
      title: '',
      keywords: [],
      skeleton: '',
      category: '',
      is_shared: false
    })
    setKeywordInput('')
  }

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keywordInput.trim()]
      })
      setKeywordInput('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter(k => k !== keyword)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || formData.keywords.length === 0 || !formData.skeleton) {
      alert('Please fill in all required fields')
      return
    }

    try {
      if (editingTemplate) {
        // Update existing template
        const updateData: TemplateUpdate = {
          title: formData.title,
          keywords: formData.keywords,
          skeleton: formData.skeleton,
          category: formData.category || undefined,
          is_shared: formData.is_shared
        }
        await api.updateTemplate(editingTemplate.id, updateData)
        alert('Template updated successfully')
      } else {
        // Create new template
        await api.createTemplate(formData)
        alert('Template created successfully')
      }
      closeForm()
      loadTemplates()
    } catch (error) {
      console.error('Failed to save template:', error)
      alert('Failed to save template: ' + (error as Error).message)
    }
  }

  const handleDelete = async (template: TemplateResponse) => {
    if (template.is_system_template) {
      alert('Cannot delete system templates')
      return
    }

    if (!confirm(`Are you sure you want to delete "${template.title}"?`)) {
      return
    }

    try {
      await api.deleteTemplate(template.id)
      alert('Template deleted successfully')
      loadTemplates()
    } catch (error) {
      console.error('Failed to delete template:', error)
      alert('Failed to delete template')
    }
  }

  const displayTemplates = view === 'all' ? templates : myTemplates

  return (
    <div className="template-builder-container">
      <div className="header-section">
        <h1 className="page-title">Custom Template Builder</h1>
        <button className="btn-create" onClick={openCreateForm}>
          + Create New Template
        </button>
      </div>

      <div className="view-toggle">
        <button
          className={`toggle-btn ${view === 'all' ? 'active' : ''}`}
          onClick={() => setView('all')}
        >
          All Templates
        </button>
        <button
          className={`toggle-btn ${view === 'my' ? 'active' : ''}`}
          onClick={() => setView('my')}
        >
          My Templates
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading templates...</div>
      ) : displayTemplates.length === 0 ? (
        <div className="empty-state">
          <p>No templates found</p>
          {view === 'my' && (
            <button className="btn-create-inline" onClick={openCreateForm}>
              Create your first template
            </button>
          )}
        </div>
      ) : (
        <div className="templates-grid">
          {displayTemplates.map((template) => (
            <div key={template.id} className="template-card">
              <div className="template-header">
                <h3 className="template-title">{template.title}</h3>
                {template.is_system_template && (
                  <span className="badge system">System</span>
                )}
                {template.is_shared && !template.is_system_template && (
                  <span className="badge shared">Shared</span>
                )}
              </div>

              {template.category && (
                <div className="template-category">{template.category}</div>
              )}

              <div className="template-keywords">
                {template.keywords.map((keyword, idx) => (
                  <span key={idx} className="keyword-tag">{keyword}</span>
                ))}
              </div>

              <div className="template-skeleton-preview">
                {template.skeleton.substring(0, 200)}
                {template.skeleton.length > 200 && '...'}
              </div>

              <div className="template-meta">
                <small>
                  {template.created_by_user_name && (
                    <span>By: {template.created_by_user_name}</span>
                  )}
                  {' • '}
                  <span>Created: {new Date(template.created_at).toLocaleDateString()}</span>
                </small>
              </div>

              {!template.is_system_template && (
                <div className="template-actions">
                  <button
                    className="btn-action edit"
                    onClick={() => openEditForm(template)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-action delete"
                    onClick={() => handleDelete(template)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTemplate ? 'Edit Template' : 'Create New Template'}</h2>
              <button className="btn-close" onClick={closeForm}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label htmlFor="title">
                  Template Title <span className="required">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., CT Chest - Lung Nodule Follow-up"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input
                  id="category"
                  type="text"
                  className="form-input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., CT, MRI, X-Ray, Ultrasound"
                />
              </div>

              <div className="form-group">
                <label>
                  Keywords <span className="required">*</span>
                </label>
                <div className="keyword-input-group">
                  <input
                    type="text"
                    className="form-input"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addKeyword()
                      }
                    }}
                    placeholder="Type a keyword and press Enter"
                  />
                  <button
                    type="button"
                    className="btn-add-keyword"
                    onClick={addKeyword}
                  >
                    Add
                  </button>
                </div>
                <div className="keywords-list">
                  {formData.keywords.map((keyword, idx) => (
                    <span key={idx} className="keyword-chip">
                      {keyword}
                      <button
                        type="button"
                        className="keyword-remove"
                        onClick={() => removeKeyword(keyword)}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                {formData.keywords.length === 0 && (
                  <small className="help-text">Add at least one keyword</small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="skeleton">
                  Template Skeleton <span className="required">*</span>
                </label>
                <textarea
                  id="skeleton"
                  className="form-textarea"
                  value={formData.skeleton}
                  onChange={(e) => setFormData({ ...formData, skeleton: e.target.value })}
                  placeholder="Enter the report template structure here..."
                  rows={15}
                  required
                />
                <small className="help-text">
                  Minimum 50 characters. Use placeholders like [INDICATION], [FINDINGS], etc.
                </small>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_shared}
                    onChange={(e) => setFormData({ ...formData, is_shared: e.target.checked })}
                  />
                  <span>Share this template with other users</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .template-builder-container {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .page-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1a202c;
          margin: 0;
        }

        .btn-create {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .btn-create:hover {
          transform: translateY(-2px);
        }

        .view-toggle {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          background: #f7fafc;
          padding: 0.5rem;
          border-radius: 8px;
          width: fit-content;
        }

        .toggle-btn {
          padding: 0.5rem 1.5rem;
          background: transparent;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          color: #4a5568;
        }

        .toggle-btn.active {
          background: white;
          color: #667eea;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .template-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .template-card:hover {
          border-color: #667eea;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }

        .template-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .template-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #2d3748;
          margin: 0;
          flex: 1;
        }

        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .badge.system {
          background: #bee3f8;
          color: #2c5282;
        }

        .badge.shared {
          background: #c6f6d5;
          color: #22543d;
        }

        .template-category {
          font-size: 0.9rem;
          color: #718096;
          font-weight: 500;
        }

        .template-keywords {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .keyword-tag {
          padding: 0.25rem 0.75rem;
          background: #edf2f7;
          color: #4a5568;
          border-radius: 12px;
          font-size: 0.85rem;
        }

        .template-skeleton-preview {
          font-size: 0.85rem;
          color: #718096;
          background: #f7fafc;
          padding: 1rem;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          line-height: 1.5;
          max-height: 150px;
          overflow: hidden;
        }

        .template-meta {
          font-size: 0.85rem;
          color: #a0aec0;
          padding-top: 0.5rem;
          border-top: 1px solid #e2e8f0;
        }

        .template-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-action {
          flex: 1;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-action.edit {
          background: #667eea;
          color: white;
        }

        .btn-action.edit:hover {
          background: #5568d3;
        }

        .btn-action.delete {
          background: #fc8181;
          color: white;
        }

        .btn-action.delete:hover {
          background: #f56565;
        }

        .loading-state, .empty-state {
          text-align: center;
          padding: 3rem;
          color: #718096;
          background: white;
          border-radius: 12px;
        }

        .btn-create-inline {
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        /* Modal Styles */
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
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 700px;
          max-height: 90vh;
          overflow: auto;
          margin: 2rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .modal-content.large {
          max-width: 900px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .btn-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #718096;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.5rem;
        }

        .required {
          color: #fc8181;
        }

        .form-input, .form-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #667eea;
        }

        .form-textarea {
          font-family: 'Courier New', monospace;
          resize: vertical;
        }

        .keyword-input-group {
          display: flex;
          gap: 0.5rem;
        }

        .btn-add-keyword {
          padding: 0.75rem 1.5rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .keywords-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }

        .keyword-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: #667eea;
          color: white;
          border-radius: 20px;
          font-size: 0.9rem;
        }

        .keyword-remove {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 1rem;
          padding: 0;
          opacity: 0.8;
        }

        .keyword-remove:hover {
          opacity: 1;
        }

        .help-text {
          display: block;
          margin-top: 0.5rem;
          color: #718096;
          font-size: 0.85rem;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-weight: normal;
        }

        .checkbox-label input[type="checkbox"] {
          width: 1.2rem;
          height: 1.2rem;
          cursor: pointer;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          padding-top: 1rem;
          border-top: 2px solid #e2e8f0;
        }

        .btn-cancel {
          padding: 0.75rem 1.5rem;
          background: #e2e8f0;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-cancel:hover {
          background: #cbd5e0;
        }

        .btn-submit {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-submit:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  )
}
