import { useState, useEffect } from 'react'
import type { ReportSummary, ReportDetail, ReportStats } from '../lib/api'
import * as api from '../lib/api'

export default function ReportHistory() {
  const [reports, setReports] = useState<ReportSummary[]>([])
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [modalityFilter, setModalityFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Pagination
  const [page, setPage] = useState(0)
  const [limit] = useState(20)

  useEffect(() => {
    loadReports()
    loadStats()
  }, [page, searchQuery, modalityFilter, startDate, endDate])

  const loadReports = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        skip: (page * limit).toString(),
        limit: limit.toString(),
      })

      if (searchQuery) params.append('search', searchQuery)
      if (modalityFilter) params.append('modality', modalityFilter)
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)

      const data = await api.fetchReports(params)
      setReports(data)
    } catch (error) {
      console.error('Failed to load reports:', error)
      alert('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await api.fetchReportStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const viewReport = async (reportId: number) => {
    try {
      const report = await api.fetchReportDetail(reportId)
      setSelectedReport(report)
    } catch (error) {
      console.error('Failed to load report:', error)
      alert('Failed to load report details')
    }
  }

  const deleteReport = async (reportId: number) => {
    if (!confirm('Are you sure you want to delete this report?')) return

    try {
      await api.deleteReport(reportId)
      alert('Report deleted successfully')
      loadReports()
      loadStats()
    } catch (error) {
      console.error('Failed to delete report:', error)
      alert('Failed to delete report')
    }
  }

  const exportReport = async (reportId: number, format: 'text' | 'word' | 'pdf') => {
    try {
      if (format === 'text') {
        const blob = await api.exportReportText(reportId)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report_${reportId}.txt`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to export report:', error)
      alert('Failed to export report')
    }
  }

  return (
    <div className="report-history-container">
      <h1 className="page-title">Report History</h1>

      {/* Statistics Dashboard */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total_reports}</div>
            <div className="stat-label">Total Reports</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.reports_today}</div>
            <div className="stat-label">Today</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.reports_this_week}</div>
            <div className="stat-label">This Week</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.reports_this_month}</div>
            <div className="stat-label">This Month</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <input
          type="text"
          className="search-input"
          placeholder="Search by patient name, accession, or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          className="filter-select"
          value={modalityFilter}
          onChange={(e) => setModalityFilter(e.target.value)}
        >
          <option value="">All Modalities</option>
          <option value="CT">CT</option>
          <option value="MRI">MRI</option>
          <option value="X-Ray">X-Ray</option>
          <option value="Ultrasound">Ultrasound</option>
          <option value="PET">PET</option>
        </select>

        <input
          type="date"
          className="date-input"
          placeholder="Start Date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <input
          type="date"
          className="date-input"
          placeholder="End Date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        <button className="btn-clear-filters" onClick={() => {
          setSearchQuery('')
          setModalityFilter('')
          setStartDate('')
          setEndDate('')
        }}>
          Clear Filters
        </button>
      </div>

      {/* Reports Table */}
      <div className="reports-table-container">
        {loading ? (
          <div className="loading-state">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            <p>No reports found</p>
          </div>
        ) : (
          <table className="reports-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Accession</th>
                <th>Modality</th>
                <th>Template</th>
                <th>Indication</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{new Date(report.created_at).toLocaleDateString()}</td>
                  <td>{report.patient_name || 'N/A'}</td>
                  <td>{report.accession || 'N/A'}</td>
                  <td>
                    <span className={`modality-badge ${report.modality || 'unknown'}`}>
                      {report.modality || 'N/A'}
                    </span>
                  </td>
                  <td>{report.template_title}</td>
                  <td className="indication-preview">{report.indication_preview}</td>
                  <td>{report.user_name || 'Unknown'}</td>
                  <td className="actions-cell">
                    <button
                      className="btn-icon view"
                      onClick={() => viewReport(report.id)}
                      title="View Report"
                    >
                      👁️
                    </button>
                    <button
                      className="btn-icon export"
                      onClick={() => exportReport(report.id, 'text')}
                      title="Export as Text"
                    >
                      💾
                    </button>
                    <button
                      className="btn-icon delete"
                      onClick={() => deleteReport(report.id)}
                      title="Delete Report"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        <div className="pagination">
          <button
            className="btn-page"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span className="page-info">Page {page + 1}</span>
          <button
            className="btn-page"
            disabled={reports.length < limit}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Report Details</h2>
              <button className="btn-close" onClick={() => setSelectedReport(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="report-metadata">
                <div className="meta-item">
                  <strong>Patient:</strong> {selectedReport.patient_name || 'N/A'}
                </div>
                <div className="meta-item">
                  <strong>Accession:</strong> {selectedReport.accession || 'N/A'}
                </div>
                <div className="meta-item">
                  <strong>Study Date:</strong> {selectedReport.study_datetime || 'N/A'}
                </div>
                <div className="meta-item">
                  <strong>Modality:</strong> {selectedReport.modality || 'N/A'}
                </div>
                <div className="meta-item">
                  <strong>Template:</strong> {selectedReport.template_title}
                </div>
                <div className="meta-item">
                  <strong>Doctor:</strong> {selectedReport.doctor_name || 'N/A'}
                </div>
                <div className="meta-item">
                  <strong>Hospital:</strong> {selectedReport.hospital_name || 'N/A'}
                </div>
              </div>

              <div className="report-section">
                <h3>Indication:</h3>
                <p className="report-text">{selectedReport.indication}</p>
              </div>

              <div className="report-section">
                <h3>Generated Report:</h3>
                <pre className="report-text">{selectedReport.generated_report}</pre>
              </div>

              {selectedReport.ai_summary && (
                <div className="report-section">
                  <h3>AI Summary:</h3>
                  <p className="report-text">{selectedReport.ai_summary}</p>
                </div>
              )}

              {selectedReport.key_findings && selectedReport.key_findings.length > 0 && (
                <div className="report-section">
                  <h3>Key Findings:</h3>
                  <ul className="findings-list">
                    {selectedReport.key_findings.map((finding: string, idx: number) => (
                      <li key={idx}>{finding}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .report-history-container {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 12px;
          text-align: center;
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .filters-section {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .search-input {
          flex: 2;
          min-width: 300px;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
        }

        .filter-select, .date-input {
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
        }

        .btn-clear-filters {
          padding: 0.75rem 1.5rem;
          background: #e2e8f0;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-clear-filters:hover {
          background: #cbd5e0;
        }

        .reports-table-container {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .reports-table {
          width: 100%;
          border-collapse: collapse;
        }

        .reports-table th {
          text-align: left;
          padding: 1rem;
          font-weight: 600;
          color: #4a5568;
          border-bottom: 2px solid #e2e8f0;
        }

        .reports-table td {
          padding: 1rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .reports-table tbody tr:hover {
          background: #f7fafc;
        }

        .modality-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .modality-badge.CT {
          background: #bee3f8;
          color: #2c5282;
        }

        .modality-badge.MRI {
          background: #c6f6d5;
          color: #22543d;
        }

        .modality-badge.X-Ray {
          background: #feebc8;
          color: #7c2d12;
        }

        .modality-badge.Ultrasound {
          background: #e9d8fd;
          color: #553c9a;
        }

        .modality-badge.PET {
          background: #fed7d7;
          color: #742a2a;
        }

        .indication-preview {
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .actions-cell {
          display: flex;
          gap: 0.5rem;
        }

        .btn-icon {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0.25rem;
          transition: transform 0.2s;
        }

        .btn-icon:hover {
          transform: scale(1.2);
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
        }

        .btn-page {
          padding: 0.5rem 1rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-page:hover:not(:disabled) {
          background: #5568d3;
        }

        .btn-page:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-info {
          font-weight: 600;
          color: #4a5568;
        }

        .loading-state, .empty-state {
          text-align: center;
          padding: 3rem;
          color: #718096;
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
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 900px;
          max-height: 90vh;
          overflow: auto;
          margin: 2rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
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

        .report-metadata {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 8px;
        }

        .meta-item {
          font-size: 0.9rem;
        }

        .meta-item strong {
          color: #4a5568;
        }

        .report-section {
          margin-bottom: 1.5rem;
        }

        .report-section h3 {
          font-size: 1.1rem;
          color: #2d3748;
          margin-bottom: 0.75rem;
        }

        .report-text {
          background: #f7fafc;
          padding: 1rem;
          border-radius: 6px;
          line-height: 1.6;
          white-space: pre-wrap;
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
        }

        .findings-list {
          list-style: none;
          padding: 0;
        }

        .findings-list li {
          padding: 0.5rem;
          background: #f7fafc;
          margin-bottom: 0.5rem;
          border-radius: 6px;
          border-left: 3px solid #667eea;
        }
      `}</style>
    </div>
  )
}
