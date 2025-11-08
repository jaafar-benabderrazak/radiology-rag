import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  fetchReportHistory,
  fetchReportDetail,
  downloadReportWord,
  downloadReportPDF,
  type ReportHistory as ReportHistoryType,
  type ReportDetail
} from '../lib/api'

export default function ReportHistory() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState<ReportHistoryType[]>([])
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [downloading, setDownloading] = useState<number | null>(null)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      setLoading(true)
      const data = await fetchReportHistory(100)
      setReports(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleViewReport = async (reportId: number) => {
    try {
      const detail = await fetchReportDetail(reportId)
      setSelectedReport(detail)
    } catch (err: any) {
      alert(`Failed to load report: ${err.message}`)
    }
  }

  const handleDownloadWord = async (reportId: number, patientName: string | null) => {
    try {
      setDownloading(reportId)
      const blob = await downloadReportWord(reportId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${patientName || 'Report'}_${reportId}.docx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      alert(`Failed to download: ${err.message}`)
    } finally {
      setDownloading(null)
    }
  }

  const handleDownloadPDF = async (reportId: number, patientName: string | null) => {
    try {
      setDownloading(reportId)
      const blob = await downloadReportPDF(reportId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${patientName || 'Report'}_${reportId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      alert(`Failed to download: ${err.message}`)
    } finally {
      setDownloading(null)
    }
  }

  const filteredReports = reports.filter(report => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      report.patient_name?.toLowerCase().includes(search) ||
      report.accession?.toLowerCase().includes(search) ||
      report.template_title.toLowerCase().includes(search) ||
      report.indication.toLowerCase().includes(search)
    )
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="report-history">
      {/* Header */}
      <header className="page-header">
        <div className="header-content">
          <h1>📊 Report History</h1>
          <div className="header-actions">
            {user && (
              <div className="user-info">
                <span className="user-name">{user.full_name}</span>
                <span className="user-hospital">{user.hospital_name || 'Radiology System'}</span>
              </div>
            )}
            <button onClick={() => navigate('/app')} className="btn-secondary">
              New Report
            </button>
            {user?.role === 'admin' && (
              <button onClick={() => navigate('/admin')} className="btn-secondary">
                Admin
              </button>
            )}
            <button onClick={() => { logout(); navigate('/') }} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="history-container">
        {/* Search and filters */}
        <div className="controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by patient name, accession, template, or indication..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          <div className="stats">
            <span className="stat-badge">{filteredReports.length} reports</span>
          </div>
        </div>

        {/* Report list */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading reports...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p className="error-message">⚠️ {error}</p>
            <button onClick={loadReports} className="btn-retry">Retry</button>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No reports found</h3>
            <p>{searchTerm ? 'Try adjusting your search' : 'Generate your first report to get started'}</p>
            <button onClick={() => navigate('/app')} className="btn-primary">
              Generate Report
            </button>
          </div>
        ) : (
          <div className="reports-grid">
            {filteredReports.map((report) => (
              <div key={report.id} className="report-card">
                <div className="card-header">
                  <h3 className="report-title">{report.template_title}</h3>
                  <span className="report-date">{formatDate(report.created_at)}</span>
                </div>
                <div className="card-body">
                  {report.patient_name && (
                    <div className="info-row">
                      <span className="label">Patient:</span>
                      <span className="value">{report.patient_name}</span>
                    </div>
                  )}
                  {report.accession && (
                    <div className="info-row">
                      <span className="label">Accession:</span>
                      <span className="value">{report.accession}</span>
                    </div>
                  )}
                  <div className="info-row indication">
                    <span className="label">Indication:</span>
                    <span className="value">{report.indication}</span>
                  </div>
                </div>
                <div className="card-actions">
                  <button
                    onClick={() => handleViewReport(report.id)}
                    className="btn-action btn-view"
                  >
                    👁️ View
                  </button>
                  <button
                    onClick={() => handleDownloadWord(report.id, report.patient_name)}
                    disabled={downloading === report.id}
                    className="btn-action btn-download"
                  >
                    {downloading === report.id ? '⏳' : '📄'} Word
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(report.id, report.patient_name)}
                    disabled={downloading === report.id}
                    className="btn-action btn-download"
                  >
                    {downloading === report.id ? '⏳' : '📕'} PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedReport(null)}>×</button>
            <h2 className="modal-title">{selectedReport.template_title}</h2>
            <div className="modal-meta">
              {selectedReport.patient_name && (
                <div><strong>Patient:</strong> {selectedReport.patient_name}</div>
              )}
              {selectedReport.accession && (
                <div><strong>Accession:</strong> {selectedReport.accession}</div>
              )}
              {selectedReport.doctor_name && (
                <div><strong>Doctor:</strong> {selectedReport.doctor_name}</div>
              )}
              {selectedReport.hospital_name && (
                <div><strong>Hospital:</strong> {selectedReport.hospital_name}</div>
              )}
              {selectedReport.study_datetime && (
                <div><strong>Study Date:</strong> {selectedReport.study_datetime}</div>
              )}
              <div><strong>Generated:</strong> {formatDate(selectedReport.created_at)}</div>
            </div>
            <div className="modal-section">
              <h3>Clinical Indication</h3>
              <pre className="indication-text">{selectedReport.indication}</pre>
            </div>
            <div className="modal-section">
              <h3>Generated Report</h3>
              <pre className="report-text">{selectedReport.generated_report}</pre>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => handleDownloadWord(selectedReport.id, selectedReport.patient_name)}
                className="btn-download-large"
              >
                📄 Download Word
              </button>
              <button
                onClick={() => handleDownloadPDF(selectedReport.id, selectedReport.patient_name)}
                className="btn-download-large"
              >
                📕 Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .report-history {
          min-height: 100vh;
          background: #f5f7fa;
        }

        .page-header {
          background: white;
          border-bottom: 2px solid #e2e8f0;
          padding: 1rem 2rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .page-header h1 {
          margin: 0;
          color: #1a202c;
          font-size: 1.75rem;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }

        .user-name {
          font-weight: 600;
          color: #2d3748;
        }

        .user-hospital {
          font-size: 0.85rem;
          color: #718096;
        }

        .btn-secondary {
          padding: 0.5rem 1rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #5a67d8;
        }

        .btn-logout {
          padding: 0.5rem 1rem;
          background: #e53e3e;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .history-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }

        .controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 300px;
          position: relative;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 2.5rem 0.75rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .search-icon {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1.25rem;
        }

        .stats {
          display: flex;
          gap: 0.5rem;
        }

        .stat-badge {
          padding: 0.5rem 1rem;
          background: #667eea;
          color: white;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .loading-state, .error-state, .empty-state {
          text-align: center;
          padding: 4rem 2rem;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #e2e8f0;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-message {
          color: #e53e3e;
          font-size: 1.1rem;
          margin-bottom: 1rem;
        }

        .btn-retry {
          padding: 0.75rem 1.5rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .empty-state {
          color: #718096;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          color: #2d3748;
          margin-bottom: 0.5rem;
        }

        .btn-primary {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          margin-top: 1rem;
        }

        .reports-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .report-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: all 0.3s;
        }

        .report-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          transform: translateY(-2px);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          gap: 1rem;
        }

        .report-title {
          font-size: 1.1rem;
          color: #2d3748;
          margin: 0;
          flex: 1;
        }

        .report-date {
          font-size: 0.85rem;
          color: #718096;
          white-space: nowrap;
        }

        .card-body {
          margin-bottom: 1rem;
        }

        .info-row {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-size: 0.95rem;
        }

        .info-row .label {
          font-weight: 600;
          color: #4a5568;
        }

        .info-row .value {
          color: #718096;
        }

        .info-row.indication .value {
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .card-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .btn-action {
          flex: 1;
          padding: 0.5rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-action:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-view {
          background: #667eea;
          color: white;
        }

        .btn-view:hover:not(:disabled) {
          background: #5a67d8;
        }

        .btn-download {
          background: #48bb78;
          color: white;
        }

        .btn-download:hover:not(:disabled) {
          background: #38a169;
        }

        /* Modal styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
        }

        .report-modal {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          max-width: 900px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }

        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 2rem;
          color: #9ca3af;
          cursor: pointer;
        }

        .modal-title {
          color: #1a202c;
          margin-bottom: 1rem;
        }

        .modal-meta {
          background: #f7fafc;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.75rem;
          font-size: 0.95rem;
        }

        .modal-section {
          margin-bottom: 1.5rem;
        }

        .modal-section h3 {
          color: #2d3748;
          margin-bottom: 0.75rem;
          font-size: 1.1rem;
        }

        .indication-text, .report-text {
          background: #f7fafc;
          padding: 1rem;
          border-radius: 8px;
          white-space: pre-wrap;
          font-family: inherit;
          font-size: 0.95rem;
          line-height: 1.6;
          color: #2d3748;
          margin: 0;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
        }

        .btn-download-large {
          padding: 0.75rem 2rem;
          background: #48bb78;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
        }

        .btn-download-large:hover {
          background: #38a169;
        }

        @media (max-width: 768px) {
          .reports-grid {
            grid-template-columns: 1fr;
          }

          .header-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-actions {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  )
}
