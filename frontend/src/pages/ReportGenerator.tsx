import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
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
} from "../lib/api"

// Language interface
type Language = 'en' | 'fr'

// UI translations
const translations = {
  en: {
    title: "Radiology Report Generator",
    subtitle: "AI-Powered Medical Report Generation with RAG",
    clinicalInfo: "Clinical Information",
    reportTemplate: "Report Template",
    autoDetect: "Auto-detect (with RAG)",
    autoDetectHelp: "AI will automatically select the best template based on your input and use similar cases for context",
    selectedTemplateHelp: "Using selected template directly (no RAG)",
    clinicalIndication: "Clinical Indication",
    voiceInput: "Voice Input",
    recording: "Recording...",
    placeholder: `Enter clinical indication, symptoms, or reason for study...

Example:
Patient with acute onset shortness of breath and pleuritic chest pain. D-dimer elevated. Rule out pulmonary embolism.`,
    metadata: "Patient & Study Metadata (Optional)",
    patientName: "Patient Name",
    accessionNumber: "Accession #",
    radiologist: "Radiologist",
    hospital: "Hospital",
    generateReport: "Generate Report",
    generating: "Generating...",
    clear: "Clear",
    generatedReport: "Generated Report",
    copyToClipboard: "Copy to Clipboard",
    copiedToClipboard: "Report copied to clipboard!",
    downloadOptions: "Download Options",
    word: "Word (.docx)",
    wordHighlighted: "Word (Highlighted)",
    pdf: "PDF",
    downloading: "Downloading...",
    reportIdError: "Report ID not available. Cannot download formatted documents.",
    aiAnalysisTools: "AI Analysis Tools",
    generateSummary: "Generate Summary",
    validateReport: "Validate Report",
    analyzing: "Analyzing...",
    validating: "Validating...",
    aiGeneratedSummary: "AI-Generated Summary",
    summary: "Summary:",
    conclusion: "Conclusion:",
    keyFindings: "Key Findings:",
    validationResults: "Validation Results",
    errors: "Errors:",
    warnings: "Warnings:",
    viewDetails: "View Details",
    noIssuesFound: "No issues found. Report appears consistent and complete.",
    similarCasesReference: "Similar Cases Reference",
    case: "Case",
    match: "match",
    emptyState: "Enter clinical information and click \"Generate Report\" to create a radiology report",
    language: "Language",
    showHighlights: "Show Highlights",
    hideHighlights: "Hide Highlights",
    highlightsLegend: "Key findings and important phrases are highlighted"
  },
  fr: {
    title: "Générateur de Rapports Radiologiques",
    subtitle: "Génération de Rapports Médicaux Alimentée par IA avec RAG",
    clinicalInfo: "Informations Cliniques",
    reportTemplate: "Modèle de Rapport",
    autoDetect: "Détection automatique (avec RAG)",
    autoDetectHelp: "L'IA sélectionnera automatiquement le meilleur modèle basé sur votre saisie et utilisera des cas similaires pour le contexte",
    selectedTemplateHelp: "Utilisation du modèle sélectionné directement (sans RAG)",
    clinicalIndication: "Indication Clinique",
    voiceInput: "Saisie Vocale",
    recording: "Enregistrement...",
    placeholder: `Entrez l'indication clinique, les symptômes ou la raison de l'examen...

Exemple:
Patient avec dyspnée aiguë et douleur thoracique pleurétique. D-dimères élevés. Éliminer une embolie pulmonaire.`,
    metadata: "Métadonnées Patient & Examen (Optionnel)",
    patientName: "Nom du Patient",
    accessionNumber: "Numéro d'Accès",
    radiologist: "Radiologue",
    hospital: "Hôpital",
    generateReport: "Générer le Rapport",
    generating: "Génération en cours...",
    clear: "Effacer",
    generatedReport: "Rapport Généré",
    copyToClipboard: "Copier dans le Presse-papiers",
    copiedToClipboard: "Rapport copié dans le presse-papiers!",
    downloadOptions: "Options de Téléchargement",
    word: "Word (.docx)",
    wordHighlighted: "Word (Surligné)",
    pdf: "PDF",
    downloading: "Téléchargement...",
    reportIdError: "ID de rapport non disponible. Impossible de télécharger les documents formatés.",
    aiAnalysisTools: "Outils d'Analyse IA",
    generateSummary: "Générer un Résumé",
    validateReport: "Valider le Rapport",
    analyzing: "Analyse...",
    validating: "Validation...",
    aiGeneratedSummary: "Résumé Généré par IA",
    summary: "Résumé:",
    conclusion: "Conclusion:",
    keyFindings: "Constatations Clés:",
    validationResults: "Résultats de Validation",
    errors: "Erreurs:",
    warnings: "Avertissements:",
    viewDetails: "Voir les Détails",
    noIssuesFound: "Aucun problème trouvé. Le rapport semble cohérent et complet.",
    similarCasesReference: "Référence de Cas Similaires",
    case: "Cas",
    match: "correspondance",
    emptyState: "Entrez les informations cliniques et cliquez sur \"Générer le Rapport\" pour créer un rapport radiologique",
    language: "Langue",
    showHighlights: "Afficher les Surlignages",
    hideHighlights: "Masquer les Surlignages",
    highlightsLegend: "Les résultats clés et phrases importantes sont surlignés"
  }
}

export default function ReportGenerator() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Language state - default to French
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('radiology-app-language')
    return (saved === 'en' || saved === 'fr') ? saved : 'fr'
  })

  const t = translations[language]

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

  // Voice input state
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const [interimText, setInterimText] = useState('')
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [isVoiceSupported, setIsVoiceSupported] = useState(false)

  // Highlighting state
  const [showHighlights, setShowHighlights] = useState(true)

  // Metadata fields
  const [patientName, setPatientName] = useState("")
  const [doctorName, setDoctorName] = useState("Dr. John Smith")
  const [hospitalName, setHospitalName] = useState("General Hospital")
  const [accession, setAccession] = useState("CR-000001")

  // Save language preference
  useEffect(() => {
    localStorage.setItem('radiology-app-language', language)
  }, [language])

  // Load templates on mount
  useEffect(() => {
    fetchTemplates()
      .then(setTemplates)
      .catch(err => console.error("Failed to load templates:", err))
  }, [])

  // Initialize speech recognition on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognitionInstance = new SpeechRecognition()

      // Configure recognition
      recognitionInstance.continuous = true
      recognitionInstance.interimResults = true
      recognitionInstance.maxAlternatives = 3
      recognitionInstance.lang = language === 'fr' ? 'fr-FR' : 'en-US'

      recognitionInstance.onstart = () => {
        console.log('Voice recognition started')
        setVoiceError(null)
        setInterimText('')
      }

      recognitionInstance.onresult = (event: any) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        // Update interim text for live feedback
        setInterimText(interimTranscript)

        // Add final transcript to input
        if (finalTranscript) {
          setInputText(prev => {
            const newText = prev + finalTranscript
            // Clear interim text when we get final text
            setInterimText('')
            return newText
          })
        }
      }

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)

        const errorMessages: Record<string, {fr: string, en: string}> = {
          'no-speech': {
            fr: 'Aucune parole détectée. Parlez plus fort ou vérifiez votre microphone.',
            en: 'No speech detected. Speak louder or check your microphone.'
          },
          'audio-capture': {
            fr: 'Impossible de capturer l\'audio. Vérifiez que votre microphone est connecté.',
            en: 'Unable to capture audio. Check if your microphone is connected.'
          },
          'not-allowed': {
            fr: 'Accès au microphone refusé. Autorisez l\'accès dans les paramètres de votre navigateur.',
            en: 'Microphone access denied. Please allow microphone access in browser settings.'
          },
          'network': {
            fr: 'Erreur réseau. Vérifiez votre connexion Internet.',
            en: 'Network error. Check your internet connection.'
          },
          'aborted': {
            fr: 'Reconnaissance vocale interrompue.',
            en: 'Voice recognition aborted.'
          }
        }

        const errorMsg = errorMessages[event.error] || {
          fr: `Erreur de reconnaissance vocale: ${event.error}`,
          en: `Voice recognition error: ${event.error}`
        }

        setVoiceError(language === 'fr' ? errorMsg.fr : errorMsg.en)
        setIsRecording(false)
        setInterimText('')

        // Auto-dismiss error after 5 seconds unless it's a permission error
        if (event.error !== 'not-allowed') {
          setTimeout(() => setVoiceError(null), 5000)
        }
      }

      recognitionInstance.onend = () => {
        console.log('Voice recognition ended')
        // Auto-restart if still in recording mode (handles silence timeout)
        if (isRecording) {
          try {
            recognitionInstance.start()
          } catch (err) {
            console.log('Could not restart recognition:', err)
            setIsRecording(false)
          }
        } else {
          setInterimText('')
        }
      }

      setRecognition(recognitionInstance)
      setIsVoiceSupported(true)
    } else {
      setIsVoiceSupported(false)
    }
  }, [language, isRecording])

  // Update recognition language when language changes
  useEffect(() => {
    if (recognition) {
      recognition.lang = language === 'fr' ? 'fr-FR' : 'en-US'
    }
  }, [language, recognition])

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

  const renderHighlightedReport = (text: string, highlights: string[]) => {
    if (!showHighlights || !highlights || highlights.length === 0) {
      return <pre className="report-text">{text}</pre>
    }

    // Create a map of positions to highlight
    const highlightMap: Array<{start: number, end: number, text: string}> = []

    highlights.forEach(highlight => {
      if (!highlight || highlight.length < 3) return // Skip very short highlights

      // Find all occurrences of this highlight in the text (case insensitive)
      const regex = new RegExp(highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
      let match
      while ((match = regex.exec(text)) !== null) {
        highlightMap.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0]
        })
      }
    })

    // Sort by start position and merge overlapping highlights
    highlightMap.sort((a, b) => a.start - b.start)
    const merged: Array<{start: number, end: number}> = []
    highlightMap.forEach(current => {
      if (merged.length === 0) {
        merged.push(current)
      } else {
        const last = merged[merged.length - 1]
        if (current.start <= last.end) {
          // Overlapping, merge them
          last.end = Math.max(last.end, current.end)
        } else {
          merged.push(current)
        }
      }
    })

    // Build the JSX with highlighted sections
    if (merged.length === 0) {
      return <pre className="report-text">{text}</pre>
    }

    const elements: JSX.Element[] = []
    let lastIndex = 0

    merged.forEach((highlight, idx) => {
      // Add text before highlight
      if (highlight.start > lastIndex) {
        elements.push(
          <span key={`text-${idx}`}>{text.substring(lastIndex, highlight.start)}</span>
        )
      }
      // Add highlighted text
      elements.push(
        <mark key={`highlight-${idx}`} className="highlight-text">
          {text.substring(highlight.start, highlight.end)}
        </mark>
      )
      lastIndex = highlight.end
    })

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(
        <span key="text-end">{text.substring(lastIndex)}</span>
      )
    }

    return <pre className="report-text">{elements}</pre>
  }

  const handleGenerateSummary = async () => {
    if (!result?.report_id) return

    setAnalysisLoading(true)
    try {
      const summaryResult = await generateSummary(result.report_id, language)
      setSummary(summaryResult)
    } catch (err: any) {
      const message = language === 'fr'
        ? `Échec de la génération du résumé: ${err.message}`
        : `Failed to generate summary: ${err.message}`
      alert(message)
    } finally {
      setAnalysisLoading(false)
    }
  }

  const handleValidateReport = async () => {
    if (!result?.report_id) return

    setAnalysisLoading(true)
    try {
      const validationResult = await validateReport(result.report_id, language)
      setValidation(validationResult)
    } catch (err: any) {
      const message = language === 'fr'
        ? `Échec de la validation du rapport: ${err.message}`
        : `Failed to validate report: ${err.message}`
      alert(message)
    } finally {
      setAnalysisLoading(false)
    }
  }

  const toggleVoiceInput = () => {
    if (!isVoiceSupported || !recognition) {
      const message = language === 'fr'
        ? 'La saisie vocale n\'est pas prise en charge par votre navigateur. Utilisez Chrome, Edge ou Safari.'
        : 'Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.'
      setVoiceError(message)
      setTimeout(() => setVoiceError(null), 5000)
      return
    }

    if (isRecording) {
      // Stop recording
      recognition.stop()
      setIsRecording(false)
      setInterimText('')
      setVoiceError(null)
    } else {
      // Start recording
      try {
        setVoiceError(null)
        recognition.start()
        setIsRecording(true)
      } catch (err: any) {
        console.error('Error starting recognition:', err)

        // Handle already started error
        if (err.message && err.message.includes('already started')) {
          recognition.stop()
          setTimeout(() => {
            try {
              recognition.start()
              setIsRecording(true)
            } catch (e) {
              console.error('Retry failed:', e)
              setVoiceError(
                language === 'fr'
                  ? 'Impossible de démarrer la saisie vocale. Veuillez réessayer.'
                  : 'Could not start voice input. Please try again.'
              )
            }
          }, 100)
        } else {
          setVoiceError(
            language === 'fr'
              ? 'Impossible de démarrer la saisie vocale. Vérifiez les autorisations du microphone.'
              : 'Could not start voice input. Check microphone permissions.'
          )
          setTimeout(() => setVoiceError(null), 5000)
        }
      }
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
          <div className="header-content">
            <div>
              <h1 className="title">{t.title}</h1>
              <p className="subtitle">{t.subtitle}</p>
            </div>
            <div className="header-actions">
              {user && (
                <div className="user-info">
                  <span className="user-name">{user.full_name}</span>
                  <span className="user-hospital">{user.hospital_name || 'Radiology System'}</span>
                </div>
              )}
              {user && user.role === 'admin' && (
                <Link to="/admin" className="admin-link">
                  ⚙️ Admin
                </Link>
              )}
              <div className="language-selector">
                <label htmlFor="language-select" className="language-label">
                  {t.language}
                </label>
                <select
                  id="language-select"
                  className="language-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>
              <button
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="btn-logout"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container main-content">
        <div className="grid">
          {/* Input Section */}
          <div className="card">
            <h2 className="card-title">{t.clinicalInfo}</h2>

            <div className="form-group">
              <label htmlFor="template" className="label">
                {t.reportTemplate}
              </label>
              <select
                id="template"
                className="select"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                <option value="auto">{t.autoDetect}</option>
                {templates.map((tpl) => (
                  <option key={tpl.template_id} value={tpl.template_id}>
                    {tpl.title}
                  </option>
                ))}
              </select>
              {selectedTemplate === "auto" && (
                <p className="help-text">
                  {t.autoDetectHelp}
                </p>
              )}
              {selectedTemplate !== "auto" && (
                <p className="help-text">
                  {t.selectedTemplateHelp}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="indication" className="label">
                {t.clinicalIndication}
                <button
                  type="button"
                  className={`voice-btn ${isRecording ? 'recording' : ''}`}
                  onClick={toggleVoiceInput}
                  title={isRecording ? t.recording : t.voiceInput}
                >
                  {isRecording ? '🔴' : '🎤'}
                  <span className="voice-label">
                    {isRecording ? ` ${t.recording}` : ` ${t.voiceInput}`}
                  </span>
                </button>
              </label>
              <textarea
                id="indication"
                className="textarea"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t.placeholder}
                rows={8}
              />
              {isRecording && interimText && (
                <div className="interim-text">
                  <span className="interim-label">
                    {language === 'fr' ? '🎙️ En cours...' : '🎙️ Listening...'}
                  </span>
                  <span className="interim-content">{interimText}</span>
                </div>
              )}
              {voiceError && (
                <div className="voice-error">
                  <span className="error-icon">⚠️</span>
                  {voiceError}
                </div>
              )}
            </div>

            {/* Metadata Section */}
            <details className="metadata-section">
              <summary className="metadata-summary">{t.metadata}</summary>
              <div className="metadata-grid">
                <div className="form-group">
                  <label htmlFor="patient" className="label-sm">{t.patientName}</label>
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
                  <label htmlFor="accession" className="label-sm">{t.accessionNumber}</label>
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
                  <label htmlFor="doctor" className="label-sm">{t.radiologist}</label>
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
                  <label htmlFor="hospital" className="label-sm">{t.hospital}</label>
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
                    {t.generating}
                  </>
                ) : (
                  t.generateReport
                )}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleClear}
                disabled={loading}
              >
                {t.clear}
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
            <h2 className="card-title">{t.generatedReport}</h2>

            {result ? (
              <>
                <div className="report-meta">
                  <span className="badge badge-success">
                    {result.templateTitle}
                  </span>
                  {result.similar_cases && result.similar_cases.length > 0 && (
                    <span className="badge badge-info">
                      {result.similar_cases.length} {language === 'fr' ? 'cas similaires utilisés' : 'similar cases used'}
                    </span>
                  )}
                </div>

                {/* Highlight Toggle */}
                {result.highlights && result.highlights.length > 0 && (
                  <div className="highlight-controls">
                    <button
                      className={`btn-highlight-toggle ${showHighlights ? 'active' : ''}`}
                      onClick={() => setShowHighlights(!showHighlights)}
                      title={showHighlights ? t.hideHighlights : t.showHighlights}
                    >
                      <span className="highlight-icon">{showHighlights ? '🔆' : '○'}</span>
                      {showHighlights ? t.hideHighlights : t.showHighlights}
                    </button>
                    {showHighlights && (
                      <span className="highlight-legend">
                        <span className="legend-sample"></span>
                        {t.highlightsLegend}
                      </span>
                    )}
                  </div>
                )}

                <div className="report-output">
                  {renderHighlightedReport(result.report, result.highlights || [])}
                </div>

                <div className="button-group">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(result.report)
                      alert(t.copiedToClipboard)
                    }}
                  >
                    {t.copyToClipboard}
                  </button>
                </div>

                <div className="download-section">
                  <h3 className="download-title">{t.downloadOptions}</h3>
                  <div className="button-group">
                    <button
                      className="btn btn-download"
                      onClick={() => handleDownloadWord(false)}
                      disabled={downloading || !result.report_id}
                      title={language === 'fr' ? "Télécharger en tant que document Word avec mise en forme d'origine" : "Download as Word document with original template formatting"}
                    >
                      {downloading ? t.downloading : t.word}
                    </button>
                    <button
                      className="btn btn-download-highlight"
                      onClick={() => handleDownloadWord(true)}
                      disabled={downloading || !result.report_id}
                      title={language === 'fr' ? "Télécharger en tant que document Word avec contenu IA surligné" : "Download as Word document with AI-generated content highlighted"}
                    >
                      {downloading ? t.downloading : t.wordHighlighted}
                    </button>
                    <button
                      className="btn btn-download-pdf"
                      onClick={handleDownloadPDF}
                      disabled={downloading || !result.report_id}
                      title={language === 'fr' ? "Télécharger en tant que document PDF" : "Download as PDF document"}
                    >
                      {downloading ? t.downloading : t.pdf}
                    </button>
                  </div>
                  {!result.report_id && (
                    <p className="help-text" style={{ marginTop: '0.5rem', color: '#e53e3e' }}>
                      {t.reportIdError}
                    </p>
                  )}
                </div>

                {/* AI Analysis Section */}
                <div className="ai-analysis-section">
                  <h3 className="analysis-title">{t.aiAnalysisTools}</h3>

                  <div className="button-group">
                    <button
                      className="btn btn-analysis"
                      onClick={handleGenerateSummary}
                      disabled={analysisLoading || !result.report_id}
                      title={language === 'fr' ? "Générer un résumé concis alimenté par l'IA du rapport" : "Generate a concise AI-powered summary of the report"}
                    >
                      {analysisLoading ? t.analyzing : t.generateSummary}
                    </button>
                    <button
                      className="btn btn-validate"
                      onClick={handleValidateReport}
                      disabled={analysisLoading || !result.report_id}
                      title={language === 'fr' ? "Vérifier les incohérences et erreurs dans le rapport" : "Check for inconsistencies and errors in the report"}
                    >
                      {analysisLoading ? t.validating : t.validateReport}
                    </button>
                  </div>

                  {/* Summary Results */}
                  {summary && (
                    <div className="summary-result">
                      <h4 className="result-title">
                        <span className="icon">📝</span> {t.aiGeneratedSummary}
                        {summary.language && (
                          <span className="language-badge">{summary.language.toUpperCase()}</span>
                        )}
                      </h4>
                      <div className="summary-content">
                        <div className="summary-section">
                          <strong className="section-label">{t.summary}</strong>
                          <p className="summary-text">{summary.summary}</p>
                        </div>

                        {summary.conclusion && (
                          <div className="conclusion-section">
                            <strong className="section-label">{t.conclusion}</strong>
                            <p className="summary-text">{summary.conclusion}</p>
                          </div>
                        )}

                        {summary.key_findings && summary.key_findings.length > 0 && (
                          <div className="key-findings">
                            <strong>{t.keyFindings}</strong>
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
                        {t.validationResults}
                        <span className={`validation-badge ${validation.status}`}>
                          {validation.status.toUpperCase()}
                        </span>
                      </h4>

                      <div className="validation-content">
                        {validation.errors && validation.errors.length > 0 && (
                          <div className="validation-errors">
                            <strong className="error-title">🚨 {t.errors}</strong>
                            <ul>
                              {validation.errors.map((error, idx) => (
                                <li key={idx} className="error-item">{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {validation.warnings && validation.warnings.length > 0 && (
                          <div className="validation-warnings">
                            <strong className="warning-title">⚠️ {t.warnings}</strong>
                            <ul>
                              {validation.warnings.map((warning, idx) => (
                                <li key={idx} className="warning-item">{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {validation.details && validation.details.length > 0 && (
                          <details className="validation-details-section">
                            <summary>{t.viewDetails}</summary>
                            <ul>
                              {validation.details.map((detail, idx) => (
                                <li key={idx}>{detail}</li>
                              ))}
                            </ul>
                          </details>
                        )}

                        {validation.status === 'passed' && (
                          <p className="validation-success">
                            ✓ {t.noIssuesFound}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {result.similar_cases && result.similar_cases.length > 0 && (
                  <details className="similar-cases-section">
                    <summary className="metadata-summary">{t.similarCasesReference}</summary>
                    <div className="similar-cases-list">
                      {result.similar_cases.map((case_, idx) => (
                        <div key={idx} className="similar-case">
                          <div className="case-header">
                            <strong>{t.case} {idx + 1}</strong>
                            <span className="similarity-score">
                              {(case_.score * 100).toFixed(1)}% {t.match}
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
                <p>{t.emptyState}</p>
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

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
        }

        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          padding: 0.5rem 1rem;
          background: #f7fafc;
          border-radius: 8px;
        }

        .user-name {
          font-weight: 600;
          color: #2d3748;
          font-size: 0.9rem;
        }

        .user-hospital {
          font-size: 0.8rem;
          color: #718096;
        }

        .btn-logout {
          padding: 0.5rem 1rem;
          background: #e53e3e;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-logout:hover {
          background: #c53030;
          transform: translateY(-1px);
        }

        .admin-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .admin-link:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
        }

        .language-selector {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: #f7fafc;
          padding: 0.75rem 1.25rem;
          border-radius: 8px;
          border: 2px solid #e2e8f0;
        }

        .language-label {
          font-weight: 600;
          color: #4a5568;
          font-size: 0.9rem;
          margin: 0;
        }

        .language-select {
          padding: 0.5rem 0.75rem;
          border: 2px solid #cbd5e0;
          border-radius: 6px;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
          color: #2d3748;
        }

        .language-select:hover {
          border-color: #667eea;
        }

        .language-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
          display: flex;
          align-items: center;
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

        .voice-btn {
          margin-left: auto;
          padding: 0.5rem 1rem;
          border: 2px solid #667eea;
          background: white;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          color: #667eea;
        }

        .voice-btn:hover {
          background: #f0f4ff;
          transform: translateY(-1px);
        }

        .voice-btn.recording {
          background: #fee2e2;
          border-color: #ef4444;
          color: #dc2626;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .voice-label {
          margin-left: 0.25rem;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .interim-text {
          margin-top: 0.75rem;
          padding: 0.75rem 1rem;
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
          border-left: 4px solid #0ea5e9;
          border-radius: 6px;
          font-size: 0.95rem;
          color: #0c4a6e;
          animation: fadeIn 0.3s ease-in;
        }

        .interim-label {
          font-weight: 600;
          margin-right: 0.5rem;
        }

        .interim-content {
          font-style: italic;
          opacity: 0.8;
        }

        .voice-error {
          margin-top: 0.75rem;
          padding: 0.75rem 1rem;
          background: #fff5f5;
          border-left: 4px solid #ef4444;
          border-radius: 6px;
          font-size: 0.9rem;
          color: #c53030;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          animation: fadeIn 0.3s ease-in;
        }

        .error-icon {
          font-size: 1.1rem;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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

        .highlight-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
          padding: 0.75rem 1rem;
          background: #f7fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .btn-highlight-toggle {
          padding: 0.5rem 1rem;
          border: 2px solid #cbd5e0;
          background: white;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #4a5568;
        }

        .btn-highlight-toggle:hover {
          border-color: #667eea;
          transform: translateY(-1px);
        }

        .btn-highlight-toggle.active {
          background: #667eea;
          border-color: #667eea;
          color: white;
        }

        .highlight-icon {
          font-size: 1.1rem;
        }

        .highlight-legend {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #718096;
          padding: 0.5rem 1rem;
          background: white;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }

        .legend-sample {
          display: inline-block;
          width: 24px;
          height: 14px;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #f59e0b;
          border-radius: 3px;
        }

        .highlight-text {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-bottom: 2px solid #f59e0b;
          padding: 0.1rem 0.2rem;
          border-radius: 3px;
          font-weight: 500;
          color: #78350f;
          animation: highlight-fade-in 0.3s ease-in;
        }

        @keyframes highlight-fade-in {
          from {
            background: transparent;
            border-bottom-color: transparent;
          }
          to {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-bottom-color: #f59e0b;
          }
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

        .language-badge {
          font-size: 0.7rem;
          padding: 0.25rem 0.5rem;
          border-radius: 8px;
          background: #e0f2fe;
          color: #0369a1;
          font-weight: 700;
          margin-left: auto;
        }

        .summary-section, .conclusion-section {
          margin-bottom: 1rem;
          padding: 1rem;
          background: #fafafa;
          border-radius: 6px;
        }

        .conclusion-section {
          background: #fffbeb;
          border-left: 3px solid #f59e0b;
        }

        .section-label {
          display: block;
          color: #1e293b;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .summary-text {
          line-height: 1.6;
          color: #475569;
          margin: 0;
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
