import { useState } from 'react'

interface DicomMetadata {
  patient: {
    patient_name: string
    patient_id: string
    patient_birth_date: string
    patient_sex: string
    patient_age?: string
  }
  study: {
    study_instance_uid: string
    study_date: string
    study_time: string
    study_description: string
    accession_number: string
    referring_physician?: string
  }
  series: {
    series_instance_uid: string
    series_number: string
    series_description: string
    modality: string
    body_part?: string
  }
  image: {
    instance_number: string
    rows: number
    columns: number
    bits_allocated: number
    bits_stored: number
    has_pixel_data: boolean
    pixel_spacing?: number[]
    slice_thickness?: string
  }
  equipment?: {
    manufacturer?: string
    model?: string
    station_name?: string
  }
}

interface DicomUploadResult {
  success: boolean
  message: string
  file_path: string
  metadata: DicomMetadata
}

interface DicomUploadProps {
  onUploadComplete?: (result: DicomUploadResult) => void
  onError?: (error: string) => void
}

export default function DicomUpload({ onUploadComplete, onError }: DicomUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<DicomUploadResult | null>(null)
  const [showMetadata, setShowMetadata] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file extension
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.dcm') && !fileName.endsWith('.dicom')) {
      setError('Please select a DICOM file (.dcm or .dicom)')
      return
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File size exceeds 100MB limit')
      return
    }

    setSelectedFile(file)
    setError(null)
    setUploadResult(null)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Get access token
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      // Create form data
      const formData = new FormData()
      formData.append('file', selectedFile)

      // Upload with progress tracking
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100
          setUploadProgress(Math.round(progress))
        }
      })

      const uploadPromise = new Promise<DicomUploadResult>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const result = JSON.parse(xhr.responseText)
            resolve(result)
          } else {
            const errorData = JSON.parse(xhr.responseText)
            reject(new Error(errorData.detail || 'Upload failed'))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'))
        })

        xhr.open('POST', 'http://localhost:8000/api/dicom/upload')
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.send(formData)
      })

      const result = await uploadPromise

      if (result.success) {
        setUploadResult(result)
        setShowMetadata(true)
        if (onUploadComplete) {
          onUploadComplete(result)
        }
      } else {
        throw new Error(result.message || 'Upload failed')
      }

    } catch (err: any) {
      console.error('Upload error:', err)
      const errorMessage = err.message || 'Failed to upload DICOM file'
      setError(errorMessage)
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setUploadResult(null)
    setError(null)
    setShowMetadata(false)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr.length !== 8) return dateStr
    const year = dateStr.substring(0, 4)
    const month = dateStr.substring(4, 6)
    const day = dateStr.substring(6, 8)
    return `${month}/${day}/${year}`
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr || timeStr.length < 6) return timeStr
    const hour = timeStr.substring(0, 2)
    const min = timeStr.substring(2, 4)
    const sec = timeStr.substring(4, 6)
    return `${hour}:${min}:${sec}`
  }

  const formatPatientName = (name: string) => {
    if (!name) return 'Unknown'
    // DICOM format: LAST^FIRST^MIDDLE
    return name.replace(/\^/g, ', ')
  }

  return (
    <div className="dicom-upload">
      <div className="upload-header">
        <span className="upload-icon">📁</span>
        <h3>DICOM File Upload</h3>
      </div>

      {error && (
        <div className="upload-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {!uploadResult && (
        <div className="upload-section">
          <div className="file-input-wrapper">
            <input
              type="file"
              id="dicom-file-input"
              accept=".dcm,.dicom"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="file-input"
            />
            <label htmlFor="dicom-file-input" className="file-input-label">
              <span className="file-icon">📂</span>
              <span>{selectedFile ? selectedFile.name : 'Choose DICOM file...'}</span>
            </label>
          </div>

          {selectedFile && (
            <div className="file-info">
              <div className="info-row">
                <span className="info-label">File:</span>
                <span className="info-value">{selectedFile.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Size:</span>
                <span className="info-value">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="upload-progress">
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span className="progress-text">{uploadProgress}%</span>
            </div>
          )}

          <div className="upload-actions">
            {selectedFile && !isUploading && (
              <>
                <button className="upload-button" onClick={handleUpload}>
                  <span className="button-icon">⬆️</span>
                  <span>Upload & Parse</span>
                </button>
                <button className="clear-button" onClick={clearSelection}>
                  Clear
                </button>
              </>
            )}

            {isUploading && (
              <div className="uploading-indicator">
                <div className="spinner"></div>
                <span>Uploading and parsing DICOM file...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {uploadResult && (
        <div className="upload-success">
          <div className="success-header">
            <span className="success-icon">✓</span>
            <h4>DICOM File Uploaded Successfully</h4>
          </div>

          <div className="success-actions">
            <button
              className="toggle-metadata-button"
              onClick={() => setShowMetadata(!showMetadata)}
            >
              {showMetadata ? '▼ Hide Metadata' : '▶ Show Metadata'}
            </button>
            <button className="upload-another-button" onClick={clearSelection}>
              Upload Another File
            </button>
          </div>

          {showMetadata && uploadResult.metadata && (
            <div className="metadata-display">
              <div className="metadata-section">
                <h5 className="metadata-section-title">Patient Information</h5>
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <span className="metadata-label">Name:</span>
                    <span className="metadata-value">
                      {formatPatientName(uploadResult.metadata.patient.patient_name)}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">ID:</span>
                    <span className="metadata-value">
                      {uploadResult.metadata.patient.patient_id}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">Birth Date:</span>
                    <span className="metadata-value">
                      {formatDate(uploadResult.metadata.patient.patient_birth_date)}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">Sex:</span>
                    <span className="metadata-value">
                      {uploadResult.metadata.patient.patient_sex}
                    </span>
                  </div>
                  {uploadResult.metadata.patient.patient_age && (
                    <div className="metadata-item">
                      <span className="metadata-label">Age:</span>
                      <span className="metadata-value">
                        {uploadResult.metadata.patient.patient_age}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="metadata-section">
                <h5 className="metadata-section-title">Study Information</h5>
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <span className="metadata-label">Description:</span>
                    <span className="metadata-value">
                      {uploadResult.metadata.study.study_description}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">Date:</span>
                    <span className="metadata-value">
                      {formatDate(uploadResult.metadata.study.study_date)}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">Time:</span>
                    <span className="metadata-value">
                      {formatTime(uploadResult.metadata.study.study_time)}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">Accession:</span>
                    <span className="metadata-value">
                      {uploadResult.metadata.study.accession_number}
                    </span>
                  </div>
                  {uploadResult.metadata.study.referring_physician && (
                    <div className="metadata-item">
                      <span className="metadata-label">Referring MD:</span>
                      <span className="metadata-value">
                        {formatPatientName(uploadResult.metadata.study.referring_physician)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="metadata-section">
                <h5 className="metadata-section-title">Series Information</h5>
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <span className="metadata-label">Modality:</span>
                    <span className="metadata-value modality-badge">
                      {uploadResult.metadata.series.modality}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">Series #:</span>
                    <span className="metadata-value">
                      {uploadResult.metadata.series.series_number}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">Description:</span>
                    <span className="metadata-value">
                      {uploadResult.metadata.series.series_description}
                    </span>
                  </div>
                  {uploadResult.metadata.series.body_part && (
                    <div className="metadata-item">
                      <span className="metadata-label">Body Part:</span>
                      <span className="metadata-value">
                        {uploadResult.metadata.series.body_part}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="metadata-section">
                <h5 className="metadata-section-title">Image Information</h5>
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <span className="metadata-label">Dimensions:</span>
                    <span className="metadata-value">
                      {uploadResult.metadata.image.rows} × {uploadResult.metadata.image.columns}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">Bit Depth:</span>
                    <span className="metadata-value">
                      {uploadResult.metadata.image.bits_stored} / {uploadResult.metadata.image.bits_allocated}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">Instance #:</span>
                    <span className="metadata-value">
                      {uploadResult.metadata.image.instance_number}
                    </span>
                  </div>
                  {uploadResult.metadata.image.slice_thickness && (
                    <div className="metadata-item">
                      <span className="metadata-label">Slice Thickness:</span>
                      <span className="metadata-value">
                        {uploadResult.metadata.image.slice_thickness} mm
                      </span>
                    </div>
                  )}
                  <div className="metadata-item">
                    <span className="metadata-label">Pixel Data:</span>
                    <span className="metadata-value">
                      {uploadResult.metadata.image.has_pixel_data ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                </div>
              </div>

              {uploadResult.metadata.equipment && (
                <div className="metadata-section">
                  <h5 className="metadata-section-title">Equipment</h5>
                  <div className="metadata-grid">
                    {uploadResult.metadata.equipment.manufacturer && (
                      <div className="metadata-item">
                        <span className="metadata-label">Manufacturer:</span>
                        <span className="metadata-value">
                          {uploadResult.metadata.equipment.manufacturer}
                        </span>
                      </div>
                    )}
                    {uploadResult.metadata.equipment.model && (
                      <div className="metadata-item">
                        <span className="metadata-label">Model:</span>
                        <span className="metadata-value">
                          {uploadResult.metadata.equipment.model}
                        </span>
                      </div>
                    )}
                    {uploadResult.metadata.equipment.station_name && (
                      <div className="metadata-item">
                        <span className="metadata-label">Station:</span>
                        <span className="metadata-value">
                          {uploadResult.metadata.equipment.station_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        .dicom-upload {
          background: var(--card-bg);
          border: 2px solid var(--border-color);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }

        .upload-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .upload-icon {
          font-size: 1.5rem;
        }

        .upload-header h3 {
          margin: 0;
          font-size: 1.1rem;
          color: var(--text-primary);
        }

        .upload-error {
          background: var(--error-bg);
          color: var(--error-text);
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .upload-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .file-input-wrapper {
          position: relative;
        }

        .file-input {
          display: none;
        }

        .file-input-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: var(--card-bg-secondary);
          border: 2px dashed var(--border-color);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
          color: var(--text-secondary);
        }

        .file-input-label:hover {
          border-color: #667eea;
          background: var(--card-bg-hover);
        }

        .file-icon {
          font-size: 1.5rem;
        }

        .file-info {
          background: var(--card-bg-secondary);
          padding: 1rem;
          border-radius: 8px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
        }

        .info-label {
          font-weight: 600;
          color: var(--text-secondary);
        }

        .info-value {
          color: var(--text-primary);
        }

        .upload-progress {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .progress-bar-container {
          width: 100%;
          height: 30px;
          background: var(--card-bg-secondary);
          border-radius: 8px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.3s ease;
        }

        .progress-text {
          text-align: center;
          font-weight: 600;
          color: var(--text-primary);
        }

        .upload-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .upload-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .upload-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .clear-button {
          padding: 0.75rem 1.5rem;
          background: transparent;
          color: var(--text-secondary);
          border: 2px solid var(--border-color);
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .clear-button:hover {
          border-color: #e53e3e;
          color: #e53e3e;
        }

        .uploading-indicator {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1.5rem;
          background: var(--card-bg-secondary);
          border-radius: 8px;
          color: var(--text-secondary);
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid var(--border-color);
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .upload-success {
          background: var(--card-bg-secondary);
          padding: 1.5rem;
          border-radius: 8px;
        }

        .success-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid var(--border-color);
        }

        .success-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 1.2rem;
        }

        .success-header h4 {
          margin: 0;
          color: var(--text-primary);
        }

        .success-actions {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .toggle-metadata-button {
          padding: 0.5rem 1rem;
          background: transparent;
          color: var(--text-primary);
          border: 2px solid var(--border-color);
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .toggle-metadata-button:hover {
          border-color: #667eea;
          color: #667eea;
        }

        .upload-another-button {
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .upload-another-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .metadata-display {
          margin-top: 1rem;
        }

        .metadata-section {
          background: var(--card-bg);
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .metadata-section-title {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          color: #667eea;
          border-bottom: 2px solid var(--border-color);
          padding-bottom: 0.5rem;
        }

        .metadata-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 0.75rem;
        }

        .metadata-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .metadata-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .metadata-value {
          font-size: 0.95rem;
          color: var(--text-primary);
          font-family: monospace;
        }

        .modality-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 4px;
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .upload-actions {
            flex-direction: column;
          }

          .success-actions {
            flex-direction: column;
          }

          .metadata-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
