import { useState, useEffect } from "react"
import {
  fetchTemplates,
  generate,
  downloadReportWord,
  downloadReportPDF,
  generateSummary,
  validateReport,
  type Template,
  type GenerateResponse,
  type SummaryResult,
  type ValidationResult
} from "./lib/api"

export default function App() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("auto")
  const [inputText, setInputText] = useState("")
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  // AI Analysis state
  const [summary, setSummary] = useState<SummaryResult | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  // Metadata fields
  const [patientName, setPatientName] = useState("")
  const [doctorName, setDoctorName] = useState("Dr. John Smith")
  const [hospitalName, setHospitalName] = useState("General Hospital")
  const [accession, setAccession] = useState("CR-000001")

  // Load templates on mount
  useEffect(() => {
    fetchTemplates()
      .then(setTemplates)
      .catch(err => console.error("Failed to load templates:", err))
  }, [])

  const handleGenerate = async () => {
    if (!inputText.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await generate({
        input: inputText,
        templateId: selectedTemplate,
        meta: {
          patient_name: patientName || "[Name not provided]",
          doctorName,
          hospitalName,
          accession
        },
        // Only use RAG when auto-selecting template
        use_rag: selectedTemplate === "auto"
      })
      setResult(response)
    } catch (err: any) {
      setError(err.message || "Failed to generate report")
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setInputText("")
    setResult(null)
    setError(null)
    setSummary(null)
    setValidation(null)
  }

  const handleGenerateSummary = async () => {
    if (!result?.report_id) return

    setAnalysisLoading(true)
    try {
      const summaryResult = await generateSummary(result.report_id)
      setSummary(summaryResult)
    } catch (err: any) {
      alert(`Failed to generate summary: ${err.message}`)
    } finally {
      setAnalysisLoading(false)
    }
  }

  const handleValidateReport = async () => {
    if (!result?.report_id) return

    setAnalysisLoading(true)
    try {
      const validationResult = await validateReport(result.report_id)
      setValidation(validationResult)
    } catch (err: any) {
      alert(`Failed to validate report: ${err.message}`)
    } finally {
      setAnalysisLoading(false)
    }
  }

  const handleDownloadWord = async (highlight: boolean = false) => {
    if (!result?.report_id) return

    setDownloading(true)
    try {
      const blob = await downloadReportWord(result.report_id, highlight)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const suffix = highlight ? '_highlighted' : ''
      a.download = `report_${accession}${suffix}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(`Failed to download Word document: ${err.message}`)
    } finally {
      setDownloading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!result?.report_id) return

    setDownloading(true)
    try {
      const blob = await downloadReportPDF(result.report_id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report_${accession}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(`Failed to download PDF: ${err.message}`)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <h1 className="title">Radiology Report Generator</h1>
          <p className="subtitle">AI-Powered Medical Report Generation with RAG</p>
        </div>
      </header>

      <main className="container main-content">
        <div className="grid">
          {/* Input Section */}
          <div className="card">
            <h2 className="card-title">Clinical Information</h2>

            <div className="form-group">
              <label htmlFor="template" className="label">
                Report Template
              </label>
              <select
                id="template"
                className="select"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                <option value="auto">Auto-detect (with RAG)</option>
                {templates.map((tpl) => (
                  <option key={tpl.template_id} value={tpl.template_id}>
                    {tpl.title}
                  </option>
                ))}
              </select>
              {selectedTemplate === "auto" && (
                <p className="help-text">
                  AI will automatically select the best template based on your input and use similar cases for context
                </p>
              )}
              {selectedTemplate !== "auto" && (
                <p className="help-text">
                  Using selected template directly (no RAG)
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="indication" className="label">
                Clinical Indication
              </label>
              <textarea
                id="indication"
                className="textarea"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter clinical indication, symptoms, or reason for study...

Example:
Patient with acute onset shortness of breath and pleuritic chest pain. D-dimer elevated. Rule out pulmonary embolism."
                rows={8}
              />
            </div>

            {/* Metadata Section */}
            <details className="metadata-section">
              <summary className="metadata-summary">Patient & Study Metadata (Optional)</summary>
              <div className="metadata-grid">
                <div className="form-group">
                  <label htmlFor="patient" className="label-sm">Patient Name</label>
                  <input
                    id="patient"
                    type="text"
                    className="input-sm"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="accession" className="label-sm">Accession #</label>
                  <input
                    id="accession"
                    type="text"
                    className="input-sm"
                    value={accession}
                    onChange={(e) => setAccession(e.target.value)}
                    placeholder="CR-000001"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="doctor" className="label-sm">Radiologist</label>
                  <input
                    id="doctor"
                    type="text"
                    className="input-sm"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Dr. Smith"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="hospital" className="label-sm">Hospital</label>
                  <input
                    id="hospital"
                    type="text"
                    className="input-sm"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    placeholder="General Hospital"
                  />
                </div>
              </div>
            </details>

            <div className="button-group">
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={loading || !inputText.trim()}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Generating...
                  </>
                ) : (
                  "Generate Report"
                )}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleClear}
                disabled={loading}
              >
                Clear
              </button>
            </div>

            {error && (
              <div className="error-box">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>

          {/* Output Section */}
          <div className="card">
            <h2 className="card-title">Generated Report</h2>

            {result ? (
              <>
                <div className="report-meta">
                  <span className="badge badge-success">
                    {result.templateTitle}
                  </span>
                  {result.similar_cases && result.similar_cases.length > 0 && (
                    <span className="badge badge-info">
                      {result.similar_cases.length} similar cases used
                    </span>
                  )}
                </div>

                <div className="report-output">
                  <pre className="report-text">{result.report}</pre>
                </div>

                <div className="button-group">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(result.report)
                      alert("Report copied to clipboard!")
                    }}
                  >
                    Copy to Clipboard
                  </button>
                </div>

                <div className="download-section">
                  <h3 className="download-title">Download Options</h3>
                  <div className="button-group">
                    <button
                      className="btn btn-download"
                      onClick={() => handleDownloadWord(false)}
                      disabled={downloading || !result.report_id}
                      title="Download as Word document with original template formatting"
                    >
                      {downloading ? "Downloading..." : "Word (.docx)"}
                    </button>
                    <button
                      className="btn btn-download-highlight"
                      onClick={() => handleDownloadWord(true)}
                      disabled={downloading || !result.report_id}
                      title="Download as Word document with AI-generated content highlighted"
                    >
                      {downloading ? "Downloading..." : "Word (Highlighted)"}
                    </button>
                    <button
                      className="btn btn-download-pdf"
                      onClick={handleDownloadPDF}
                      disabled={downloading || !result.report_id}
                      title="Download as PDF document"
                    >
                      {downloading ? "Downloading..." : "PDF"}
                    </button>
                  </div>
                  {!result.report_id && (
                    <p className="help-text" style={{ marginTop: '0.5rem', color: '#e53e3e' }}>
                      Report ID not available. Cannot download formatted documents.
                    </p>
                  )}
                </div>

                {/* AI Analysis Section */}
                <div className="ai-analysis-section">
                  <h3 className="analysis-title">AI Analysis Tools</h3>

                  <div className="button-group">
                    <button
                      className="btn btn-analysis"
                      onClick={handleGenerateSummary}
                      disabled={analysisLoading || !result.report_id}
                      title="Generate a concise AI-powered summary of the report"
                    >
                      {analysisLoading ? "Analyzing..." : "Generate Summary"}
                    </button>
                    <button
                      className="btn btn-validate"
                      onClick={handleValidateReport}
                      disabled={analysisLoading || !result.report_id}
                      title="Check for inconsistencies and errors in the report"
                    >
                      {analysisLoading ? "Validating..." : "Validate Report"}
                    </button>
                  </div>

                  {/* Summary Results */}
                  {summary && (
                    <div className="summary-result">
                      <h4 className="result-title">
                        <span className="icon">📝</span> AI-Generated Summary
                      </h4>
                      <div className="summary-content">
                        <p className="summary-text">{summary.summary}</p>
                        {summary.key_findings && summary.key_findings.length > 0 && (
                          <div className="key-findings">
                            <strong>Key Findings:</strong>
                            <ul>
                              {summary.key_findings.map((finding, idx) => (
                                <li key={idx}>{finding}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Validation Results */}
                  {validation && (
                    <div className={`validation-result ${validation.status}`}>
                      <h4 className="result-title">
                        <span className="icon">
                          {validation.status === 'passed' ? '✅' : validation.status === 'warnings' ? '⚠️' : '❌'}
                        </span>
                        Validation Results
                        <span className={`validation-badge ${validation.status}`}>
                          {validation.status.toUpperCase()}
                        </span>
                      </h4>

                      <div className="validation-content">
                        {validation.errors && validation.errors.length > 0 && (
                          <div className="validation-errors">
                            <strong className="error-title">🚨 Errors:</strong>
                            <ul>
                              {validation.errors.map((error, idx) => (
                                <li key={idx} className="error-item">{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {validation.warnings && validation.warnings.length > 0 && (
                          <div className="validation-warnings">
                            <strong className="warning-title">⚠️ Warnings:</strong>
                            <ul>
                              {validation.warnings.map((warning, idx) => (
                                <li key={idx} className="warning-item">{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {validation.details && validation.details.length > 0 && (
                          <details className="validation-details-section">
                            <summary>View Details</summary>
                            <ul>
                              {validation.details.map((detail, idx) => (
                                <li key={idx}>{detail}</li>
                              ))}
                            </ul>
                          </details>
                        )}

                        {validation.status === 'passed' && (
                          <p className="validation-success">
                            ✓ No issues found. Report appears consistent and complete.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {result.similar_cases && result.similar_cases.length > 0 && (
                  <details className="similar-cases-section">
                    <summary className="metadata-summary">Similar Cases Reference</summary>
                    <div className="similar-cases-list">
                      {result.similar_cases.map((case_, idx) => (
                        <div key={idx} className="similar-case">
                          <div className="case-header">
                            <strong>Case {idx + 1}</strong>
                            <span className="similarity-score">
                              {(case_.score * 100).toFixed(1)}% match
                            </span>
                          </div>
                          <p className="case-text">{case_.text.substring(0, 200)}...</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </>
            ) : (
              <div className="empty-state">
                <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Enter clinical information and click "Generate Report" to create a radiology report</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          color: #333;
        }

        .app {
          min-height: 100vh;
          padding-bottom: 2rem;
        }

        .header {
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 2rem 0;
          margin-bottom: 2rem;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 0.5rem;
        }

        .subtitle {
          font-size: 1.1rem;
          color: #718096;
        }

        .main-content {
          margin-top: 2rem;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }

        .card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .card-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .label {
          display: block;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 0.5rem;
          font-size: 0.95rem;
        }

        .label-sm {
          display: block;
          font-weight: 500;
          color: #4a5568;
          margin-bottom: 0.25rem;
          font-size: 0.85rem;
        }

        .select, .textarea, .input-sm {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .select:focus, .textarea:focus, .input-sm:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .textarea {
          font-family: 'Courier New', monospace;
          resize: vertical;
          min-height: 120px;
        }

        .help-text {
          margin-top: 0.5rem;
          font-size: 0.85rem;
          color: #718096;
        }

        .metadata-section {
          margin: 1.5rem 0;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 8px;
        }

        .metadata-summary {
          cursor: pointer;
          font-weight: 600;
          color: #4a5568;
          padding: 0.5rem;
          user-select: none;
        }

        .metadata-summary:hover {
          color: #667eea;
        }

        .metadata-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 1rem;
        }

        .button-group {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
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
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: #e2e8f0;
          color: #4a5568;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #cbd5e0;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #ffffff;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-box {
          margin-top: 1rem;
          padding: 1rem;
          background: #fff5f5;
          border-left: 4px solid #f56565;
          border-radius: 4px;
          color: #c53030;
        }

        .report-meta {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .badge {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .badge-success {
          background: #c6f6d5;
          color: #22543d;
        }

        .badge-info {
          background: #bee3f8;
          color: #2c5282;
        }

        .report-output {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.5rem;
          max-height: 600px;
          overflow-y: auto;
        }

        .report-text {
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
          line-height: 1.6;
          white-space: pre-wrap;
          color: #2d3748;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #a0aec0;
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 1rem;
          opacity: 0.5;
        }

        .similar-cases-section {
          margin-top: 1.5rem;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 8px;
        }

        .similar-cases-list {
          margin-top: 1rem;
        }

        .similar-case {
          background: white;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 0.75rem;
          border-left: 3px solid #667eea;
        }

        .case-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .similarity-score {
          font-size: 0.85rem;
          color: #667eea;
          font-weight: 600;
        }

        .case-text {
          font-size: 0.9rem;
          color: #4a5568;
          line-height: 1.5;
        }

        .download-section {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: #f7fafc;
          border-radius: 8px;
          border: 2px dashed #cbd5e0;
        }

        .download-title {
          font-size: 1rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 1rem;
        }

        .btn-download {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
        }

        .btn-download:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
        }

        .btn-download-highlight {
          background: linear-gradient(135deg, #ecc94b 0%, #d69e2e 100%);
          color: white;
        }

        .btn-download-highlight:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(236, 201, 75, 0.4);
        }

        .btn-download-pdf {
          background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
          color: white;
        }

        .btn-download-pdf:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(245, 101, 101, 0.4);
        }

        /* AI Analysis Section Styles */
        .ai-analysis-section {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-radius: 8px;
          border: 2px solid #bae6fd;
        }

        .analysis-title {
          font-size: 1rem;
          font-weight: 600;
          color: #0c4a6e;
          margin-bottom: 1rem;
        }

        .btn-analysis {
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          color: white;
        }

        .btn-analysis:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
        }

        .btn-validate {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }

        .btn-validate:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }

        .summary-result, .validation-result {
          margin-top: 1rem;
          padding: 1.25rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .result-title {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .result-title .icon {
          font-size: 1.2rem;
        }

        .summary-text {
          line-height: 1.6;
          color: #475569;
          margin-bottom: 1rem;
        }

        .key-findings {
          background: #f8fafc;
          padding: 1rem;
          border-radius: 6px;
          border-left: 3px solid #0ea5e9;
        }

        .key-findings ul {
          margin-top: 0.5rem;
          margin-left: 1.5rem;
        }

        .key-findings li {
          margin-bottom: 0.5rem;
          color: #334155;
        }

        .validation-result.passed {
          border-left: 4px solid #22c55e;
        }

        .validation-result.warnings {
          border-left: 4px solid #eab308;
        }

        .validation-result.errors {
          border-left: 4px solid #ef4444;
        }

        .validation-badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          margin-left: auto;
          font-weight: 700;
        }

        .validation-badge.passed {
          background: #dcfce7;
          color: #166534;
        }

        .validation-badge.warnings {
          background: #fef9c3;
          color: #854d0e;
        }

        .validation-badge.errors {
          background: #fee2e2;
          color: #991b1b;
        }

        .validation-errors, .validation-warnings {
          margin-bottom: 1rem;
        }

        .error-title, .warning-title {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.95rem;
        }

        .validation-errors ul, .validation-warnings ul {
          margin-left: 1.5rem;
          margin-top: 0.5rem;
        }

        .error-item {
          color: #dc2626;
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }

        .warning-item {
          color: #d97706;
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }

        .validation-details-section {
          margin-top: 1rem;
          padding: 0.75rem;
          background: #f8fafc;
          border-radius: 6px;
        }

        .validation-details-section summary {
          cursor: pointer;
          font-weight: 600;
          color: #475569;
          user-select: none;
        }

        .validation-details-section summary:hover {
          color: #0ea5e9;
        }

        .validation-details-section ul {
          margin-top: 0.75rem;
          margin-left: 1.5rem;
        }

        .validation-details-section li {
          color: #64748b;
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }

        .validation-success {
          padding: 1rem;
          background: #f0fdf4;
          border-radius: 6px;
          color: #166534;
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}
