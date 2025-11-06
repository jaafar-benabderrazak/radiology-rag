import { useState, useEffect } from 'react'
import { API_BASE } from '../lib/api'

interface DicomFile {
  file_path: string
  patient_id: string
  patient_name: string
  study_uid: string
  series_uid: string
  modality: string
  study_date: string
  study_description: string
  uploaded_at: string
}

interface DicomViewerProps {
  filePath?: string
  autoLoad?: boolean
}

export default function DicomViewer({ filePath, autoLoad = false }: DicomViewerProps) {
  const [files, setFiles] = useState<DicomFile[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(filePath || null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState({
    modality: '',
    patient_id: '',
  })

  // Load DICOM files list on mount
  useEffect(() => {
    loadDicomFiles()
  }, [])

  // Load image if filePath provided and autoLoad is true
  useEffect(() => {
    if (filePath && autoLoad) {
      loadDicomImage(filePath)
    }
  }, [filePath, autoLoad])

  const loadDicomFiles = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const params = new URLSearchParams()
      if (filter.modality) params.append('modality', filter.modality)
      if (filter.patient_id) params.append('patient_id', filter.patient_id)
      params.append('limit', '50')

      const response = await fetch(
        `${API_BASE}/api/dicom/list?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to load DICOM files')
      }

      const result = await response.json()
      setFiles(result.files || [])
    } catch (err: any) {
      console.error('Failed to load DICOM files:', err)
      setError(err.message)
    }
  }

  const loadDicomImage = async (path: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(
        `${API_BASE}/api/dicom/image/${path}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to load DICOM image')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setImageUrl(url)
      setSelectedFile(path)
    } catch (err: any) {
      console.error('Failed to load DICOM image:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (file: DicomFile) => {
    loadDicomImage(file.file_path)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilter(prev => ({ ...prev, [key]: value }))
  }

  const applyFilter = () => {
    loadDicomFiles()
  }

  const clearFilter = () => {
    setFilter({ modality: '', patient_id: '' })
    setTimeout(loadDicomFiles, 100)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr.length !== 8) return dateStr
    const year = dateStr.substring(0, 4)
    const month = dateStr.substring(4, 6)
    const day = dateStr.substring(6, 8)
    return `${month}/${day}/${year}`
  }

  const formatPatientName = (name: string) => {
    if (!name) return 'Unknown'
    return name.replace(/\^/g, ', ')
  }

  const formatDateTime = (isoString: string) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return date.toLocaleString()
  }

  return (
    <div className="dicom-viewer">
      <div className="viewer-header">
        <span className="viewer-icon">🖼️</span>
        <h3>DICOM Viewer</h3>
      </div>

      {error && (
        <div className="viewer-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="viewer-content">
        {/* File List Sidebar */}
        <div className="file-list-panel">
          <div className="filter-section">
            <h4>Filters</h4>
            <div className="filter-controls">
              <select
                value={filter.modality}
                onChange={(e) => handleFilterChange('modality', e.target.value)}
                className="filter-select"
              >
                <option value="">All Modalities</option>
                <option value="CT">CT</option>
                <option value="MR">MR</option>
                <option value="XR">XR</option>
                <option value="US">US</option>
                <option value="CR">CR</option>
                <option value="DX">DX</option>
                <option value="MG">MG</option>
              </select>

              <input
                type="text"
                placeholder="Patient ID"
                value={filter.patient_id}
                onChange={(e) => handleFilterChange('patient_id', e.target.value)}
                className="filter-input"
              />

              <div className="filter-buttons">
                <button onClick={applyFilter} className="apply-filter-btn">
                  Apply
                </button>
                <button onClick={clearFilter} className="clear-filter-btn">
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className="file-list">
            <div className="file-list-header">
              <span>Studies ({files.length})</span>
              <button onClick={loadDicomFiles} className="refresh-btn">
                ↻
              </button>
            </div>

            {files.length === 0 && (
              <div className="no-files">
                <span>No DICOM files found</span>
              </div>
            )}

            {files.map((file, index) => (
              <div
                key={index}
                className={`file-item ${selectedFile === file.file_path ? 'selected' : ''}`}
                onClick={() => handleFileSelect(file)}
              >
                <div className="file-modality">{file.modality}</div>
                <div className="file-details">
                  <div className="file-patient">
                    {formatPatientName(file.patient_name)}
                  </div>
                  <div className="file-study">{file.study_description}</div>
                  <div className="file-date">{formatDate(file.study_date)}</div>
                  <div className="file-id">ID: {file.patient_id}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Image Display Panel */}
        <div className="image-panel">
          {!selectedFile && !isLoading && (
            <div className="no-selection">
              <span className="no-selection-icon">🖼️</span>
              <h4>No Image Selected</h4>
              <p>Select a DICOM file from the list to view</p>
            </div>
          )}

          {isLoading && (
            <div className="loading-indicator">
              <div className="spinner-large"></div>
              <span>Loading DICOM image...</span>
            </div>
          )}

          {imageUrl && !isLoading && (
            <div className="image-container">
              <div className="image-controls">
                <button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = imageUrl
                    link.download = 'dicom_image.png'
                    link.click()
                  }}
                  className="download-btn"
                >
                  ⬇ Download
                </button>
                <button
                  onClick={() => {
                    setImageUrl(null)
                    setSelectedFile(null)
                  }}
                  className="close-btn"
                >
                  ✕ Close
                </button>
              </div>

              <div className="image-wrapper">
                <img
                  src={imageUrl}
                  alt="DICOM Image"
                  className="dicom-image"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .dicom-viewer {
          background: var(--card-bg);
          border: 2px solid var(--border-color);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }

        .viewer-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .viewer-icon {
          font-size: 1.5rem;
        }

        .viewer-header h3 {
          margin: 0;
          font-size: 1.1rem;
          color: var(--text-primary);
        }

        .viewer-error {
          background: var(--error-bg);
          color: var(--error-text);
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .viewer-content {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 1.5rem;
          min-height: 500px;
        }

        .file-list-panel {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .filter-section {
          background: var(--card-bg-secondary);
          padding: 1rem;
          border-radius: 8px;
        }

        .filter-section h4 {
          margin: 0 0 0.75rem 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .filter-controls {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .filter-select,
        .filter-input {
          padding: 0.5rem;
          background: var(--card-bg);
          border: 2px solid var(--border-color);
          border-radius: 6px;
          color: var(--text-primary);
          font-size: 0.9rem;
        }

        .filter-select:focus,
        .filter-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .filter-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .apply-filter-btn,
        .clear-filter-btn {
          flex: 1;
          padding: 0.5rem;
          border: none;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .apply-filter-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .apply-filter-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .clear-filter-btn {
          background: transparent;
          color: var(--text-secondary);
          border: 2px solid var(--border-color);
        }

        .clear-filter-btn:hover {
          border-color: #e53e3e;
          color: #e53e3e;
        }

        .file-list {
          background: var(--card-bg-secondary);
          border-radius: 8px;
          overflow: hidden;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .file-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: var(--card-bg);
          border-bottom: 2px solid var(--border-color);
          font-weight: 600;
          color: var(--text-primary);
        }

        .refresh-btn {
          background: transparent;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all 0.3s;
        }

        .refresh-btn:hover {
          color: #667eea;
          transform: rotate(180deg);
        }

        .no-files {
          padding: 2rem;
          text-align: center;
          color: var(--text-secondary);
        }

        .file-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
          transition: all 0.2s;
        }

        .file-item:hover {
          background: var(--card-bg-hover);
        }

        .file-item.selected {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
          border-left: 4px solid #667eea;
        }

        .file-modality {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.75rem;
        }

        .file-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .file-patient {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.9rem;
        }

        .file-study {
          color: var(--text-secondary);
          font-size: 0.85rem;
        }

        .file-date {
          color: var(--text-secondary);
          font-size: 0.8rem;
        }

        .file-id {
          color: var(--text-secondary);
          font-size: 0.75rem;
          font-family: monospace;
        }

        .image-panel {
          background: var(--card-bg-secondary);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .no-selection {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: var(--text-secondary);
          padding: 2rem;
          text-align: center;
        }

        .no-selection-icon {
          font-size: 4rem;
          opacity: 0.5;
        }

        .no-selection h4 {
          margin: 0;
          color: var(--text-primary);
        }

        .no-selection p {
          margin: 0;
          font-size: 0.9rem;
        }

        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: var(--text-secondary);
          padding: 2rem;
        }

        .spinner-large {
          width: 48px;
          height: 48px;
          border: 4px solid var(--border-color);
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .image-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .image-controls {
          display: flex;
          gap: 0.5rem;
          padding: 0.75rem;
          background: var(--card-bg);
          border-bottom: 2px solid var(--border-color);
        }

        .download-btn,
        .close-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .download-btn {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
        }

        .download-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(72, 187, 120, 0.3);
        }

        .close-btn {
          background: transparent;
          color: var(--text-secondary);
          border: 2px solid var(--border-color);
        }

        .close-btn:hover {
          border-color: #e53e3e;
          color: #e53e3e;
        }

        .image-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          overflow: auto;
        }

        .dicom-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 1024px) {
          .viewer-content {
            grid-template-columns: 1fr;
          }

          .file-list-panel {
            max-height: 300px;
          }

          .image-panel {
            min-height: 400px;
          }
        }

        @media (max-width: 640px) {
          .filter-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}
