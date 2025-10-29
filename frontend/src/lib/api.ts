const base = import.meta.env.VITE_API_BASE || (typeof window !== 'undefined'
  ? (window as any).__API_BASE__ || 'http://localhost:8000'
  : 'http://localhost:8000')

export interface Template {
  id: number
  template_id: string
  title: string
  keywords: string[]
  category: string | null
}

export interface GenerateRequest {
  input: string
  templateId?: string
  meta?: {
    doctorName?: string
    hospitalName?: string
    referrer?: string
    patient_name?: string
    study_datetime?: string
    accession?: string
  }
  use_rag?: boolean
}

export interface GenerateResponse {
  report: string
  templateTitle: string
  templateId: string
  highlights: string[]
  similar_cases: any[]
  report_id: number | null
}

export async function fetchTemplates(): Promise<Template[]> {
  const res = await fetch(`${base}/templates`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function generate(request: GenerateRequest): Promise<GenerateResponse> {
  const body = {
    input: request.input,
    templateId: request.templateId || "auto",
    meta: request.meta || { hospitalName: "Demo Hospital", doctorName: "Dr. Smith" },
    use_rag: request.use_rag !== false
  }
  const res = await fetch(`${base}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getHealth() {
  const res = await fetch(`${base}/health`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function downloadReportWord(reportId: number, highlight: boolean = false): Promise<Blob> {
  const url = `${base}/reports/${reportId}/download/word${highlight ? '?highlight=true' : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(await res.text())
  return res.blob()
}

export async function downloadReportPDF(reportId: number): Promise<Blob> {
  const url = `${base}/reports/${reportId}/download/pdf`
  const res = await fetch(url)
  if (!res.ok) throw new Error(await res.text())
  return res.blob()
}

// AI Analysis interfaces
export interface SummaryResult {
  status: string
  report_id: number
  summary: string
  key_findings: string[]
}

export interface ValidationResult {
  status: 'passed' | 'warnings' | 'errors'
  report_id: number
  is_consistent: boolean
  severity: string
  errors: string[]
  warnings: string[]
  details: string[]
}

export interface AnalysisResult {
  report_id: number
  summary: {
    text: string | null
    key_findings: string[] | null
  }
  validation: {
    status: string | null
    errors: string[]
    warnings: string[]
    details: string[]
  }
}

// AI Analysis functions
export async function generateSummary(reportId: number, maxLength: number = 200): Promise<SummaryResult> {
  const url = `${base}/reports/${reportId}/generate-summary?max_length=${maxLength}`
  const res = await fetch(url, { method: 'POST' })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function validateReport(reportId: number): Promise<ValidationResult> {
  const url = `${base}/reports/${reportId}/validate`
  const res = await fetch(url, { method: 'POST' })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getReportAnalysis(reportId: number): Promise<AnalysisResult> {
  const url = `${base}/reports/${reportId}/analysis`
  const res = await fetch(url)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
