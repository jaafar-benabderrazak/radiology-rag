import { useState, useEffect } from "react"
import { fetchTemplates, generate, type Template, type GenerateResponse } from "./lib/api"

export default function App() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("auto")
  const [inputText, setInputText] = useState("")
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      const blob = new Blob([result.report], { type: 'text/plain' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `report_${accession}_${Date.now()}.txt`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                  >
                    Download Report
                  </button>
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
      `}</style>
    </div>
  )
}
