const getApiBase = () => {
<<<<<<< HEAD
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE
  }
  if (typeof window !== 'undefined' && (window as any).__API_BASE__) {
    return (window as any).__API_BASE__
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    // In production (Autoscale), frontend and backend are on the same origin
    const protocol = window.location.protocol
    const hostname = window.location.hostname
    return `${protocol}//${hostname}`
  }
=======
  console.log('[API Config] Detecting API base URL...')

  // Priority 1: Environment variable
  if (import.meta.env.VITE_API_BASE) {
    console.log('[API Config] Using VITE_API_BASE:', import.meta.env.VITE_API_BASE)
    return import.meta.env.VITE_API_BASE
  }

  // Priority 2: Runtime config (set by backend)
  if (typeof window !== 'undefined' && (window as any).__API_BASE__) {
    console.log('[API Config] Using window.__API_BASE__:', (window as any).__API_BASE__)
    return (window as any).__API_BASE__
  }

  // Priority 3: Production environment detection
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const protocol = window.location.protocol
    const port = window.location.port

    console.log('[API Config] Window location:', {
      protocol,
      hostname,
      port,
      origin: window.location.origin
    })

    // If not localhost, assume production deployment where frontend and backend are same origin
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      let apiBase: string

      // For Replit and most deployments, use same origin
      if (port && port !== '80' && port !== '443') {
        apiBase = `${protocol}//${hostname}:${port}`
      } else {
        apiBase = `${protocol}//${hostname}`
      }

      console.log('[API Config] Production mode - Using same origin:', apiBase)
      return apiBase
    }
  }

  // Priority 4: Local development fallback
  console.log('[API Config] Local development mode - Using localhost:8000')
>>>>>>> claude/admin-template-management-011CUtvK2niZyDKTAoaDcdRp
  return 'http://localhost:8000'
}

const base = getApiBase()
<<<<<<< HEAD
=======
console.log('[API Config] Final API base URL:', base)
>>>>>>> claude/admin-template-management-011CUtvK2niZyDKTAoaDcdRp

// Export base URL for components that need direct fetch calls
export const API_BASE = base

// Token management
const TOKEN_KEY = 'auth_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// Helper to get auth headers
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export interface Template {
  id: number
  template_id: string
  title: string
  keywords: string[]
  category: string | null
}

export interface TemplateDetail {
  id: number
  template_id: string
  title: string
  keywords: string[]
  skeleton: string
  category: string | null
  language: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export interface TemplateCreateRequest {
  template_id: string
  title: string
  keywords: string[]
  skeleton: string
  category?: string | null
  language?: string
  is_active?: boolean
}

export interface TemplateUpdateRequest {
  title?: string
  keywords?: string[]
  skeleton?: string
  category?: string | null
  language?: string
  is_active?: boolean
}

export interface ReportHistory {
  id: number
  patient_name: string | null
  accession: string | null
  indication: string
  template_title: string
  created_at: string
}

export interface ReportDetail {
  id: number
  template_title: string
  patient_name: string | null
  accession: string | null
  doctor_name: string | null
  hospital_name: string | null
  indication: string
  generated_report: string
  study_datetime: string | null
  created_at: string
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
    meta: request.meta || {},
    use_rag: request.use_rag !== false
  }
  const res = await fetch(`${base}/generate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Authentication required')
    }
    throw new Error(await res.text())
  }
  return res.json()
}

export async function getHealth() {
  const res = await fetch(`${base}/health`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function downloadReportWord(reportId: number, highlight: boolean = false): Promise<Blob> {
  const url = `${base}/reports/${reportId}/download/word${highlight ? '?highlight=true' : ''}`
  const res = await fetch(url, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error(await res.text())
  return res.blob()
}

export async function downloadReportPDF(reportId: number): Promise<Blob> {
  const url = `${base}/reports/${reportId}/download/pdf`
  const res = await fetch(url, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error(await res.text())
  return res.blob()
}

// AI Analysis interfaces
export interface SummaryResult {
  status: string
  report_id: number
  summary: string
  conclusion: string
  key_findings: string[]
  language: string
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
    conclusion: string | null
    key_findings: string[] | null
    language: string | null
  }
  validation: {
    status: string | null
    errors: string[]
    warnings: string[]
    details: string[]
  }
}

// Authentication interfaces
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  username: string
  full_name: string
  password: string
  hospital_name?: string
  specialization?: string
  license_number?: string
}

export interface User {
  id: number
  email: string
  username: string
  full_name: string
  role: string
  hospital_name: string | null
  specialization: string | null
  license_number: string | null
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string | null
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

// AI Analysis functions
export async function generateSummary(reportId: number, language: string = 'en', maxLength: number = 200): Promise<SummaryResult> {
  const url = `${base}/reports/${reportId}/generate-summary?max_length=${maxLength}&language=${language}`
  const res = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders()
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function validateReport(reportId: number, language: string = 'en'): Promise<ValidationResult> {
  const url = `${base}/reports/${reportId}/validate?language=${language}`
  const res = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders()
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getReportAnalysis(reportId: number): Promise<AnalysisResult> {
  const url = `${base}/reports/${reportId}/analysis`
  const res = await fetch(url, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// Authentication API
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  })
  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || 'Login failed')
  }
  const data = await res.json()
  setToken(data.access_token)
  return data
}

export async function register(userData: RegisterRequest): Promise<User> {
  const res = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  })
  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || 'Registration failed')
  }
  return res.json()
}

export async function getCurrentUser(): Promise<User> {
  const res = await fetch(`${base}/api/auth/me`, {
    headers: getAuthHeaders()
  })
  if (!res.ok) {
    throw new Error('Failed to get user profile')
  }
  return res.json()
}

export function logout(): void {
  removeToken()
}

<<<<<<< HEAD
// ===========================
// Report History API
// ===========================

export interface ReportSummary {
  id: number
  patient_name: string | null
  accession: string | null
  modality: string | null
  template_title: string
  indication_preview: string
  created_at: string
  user_name: string | null
}

export interface ReportDetail {
  id: number
  patient_name: string | null
  accession: string | null
  doctor_name: string | null
  hospital_name: string | null
  referrer: string | null
  indication: string
  generated_report: string
  modality: string | null
  study_datetime: string | null
  template_title: string
  template_category: string | null
  ai_summary: string | null
  ai_conclusion: string | null
  key_findings: string[] | null
  report_language: string | null
  validation_status: string | null
  validation_errors: string[] | null
  validation_warnings: string[] | null
  similar_cases_used: any[] | null
  highlights: string[] | null
  created_at: string
  updated_at: string
  created_by_user_name: string | null
}

export interface ReportStats {
  total_reports: number
  reports_today: number
  reports_this_week: number
  reports_this_month: number
  by_modality: Record<string, number>
  by_template: Record<string, number>
}

export async function fetchReports(params: URLSearchParams): Promise<ReportSummary[]> {
  const url = `${base}/api/reports?${params.toString()}`
  const res = await fetch(url, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function fetchReportStats(): Promise<ReportStats> {
  const url = `${base}/api/reports/stats`
  const res = await fetch(url, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function fetchReportDetail(id: number): Promise<ReportDetail> {
  const url = `${base}/api/reports/${id}`
  const res = await fetch(url, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function deleteReport(id: number): Promise<void> {
  const url = `${base}/api/reports/${id}`
  const res = await fetch(url, {
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function exportReportText(id: number): Promise<Blob> {
  const url = `${base}/api/reports/export/${id}/text`
  const res = await fetch(url, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error(await res.text())
  return res.blob()
}

// ===========================
// Template Management API
// ===========================

export interface TemplateResponse {
  id: number
  template_id: string
  title: string
  keywords: string[]
  skeleton: string
  category: string | null
  is_active: boolean
  is_system_template: boolean
  is_shared: boolean
  created_by_user_name: string | null
  created_at: string
  updated_at: string
}

export interface TemplateCreate {
  title: string
  keywords: string[]
  skeleton: string
  category?: string
  is_shared?: boolean
}

export interface TemplateUpdate {
  title?: string
  keywords?: string[]
  skeleton?: string
  category?: string
  is_shared?: boolean
  is_active?: boolean
}

export async function fetchAllTemplates(includeInactive: boolean = false): Promise<TemplateResponse[]> {
  const url = `${base}/api/templates?include_inactive=${includeInactive}`
  const res = await fetch(url, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function fetchMyTemplates(): Promise<TemplateResponse[]> {
  const url = `${base}/api/templates/my`
  const res = await fetch(url, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function createTemplate(data: TemplateCreate): Promise<TemplateResponse> {
  const url = `${base}/api/templates`
  const res = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getTemplateById(id: number): Promise<TemplateResponse> {
  const url = `${base}/api/templates/${id}`
  const res = await fetch(url, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function updateTemplate(id: number, data: TemplateUpdate): Promise<TemplateResponse> {
  const url = `${base}/api/templates/${id}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function deleteTemplate(id: number): Promise<void> {
  const url = `${base}/api/templates/${id}`
  const res = await fetch(url, {
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  if (!res.ok) throw new Error(await res.text())
}

// ===========================
// AI Suggestions API
// ===========================

export interface DifferentialRequest {
  findings: string
  modality?: string
  clinical_context?: string
  language?: string
}

export interface DifferentialResponse {
  differentials: Array<{
    diagnosis: string
    probability: string
    reasoning: string
  }>
  additional_workup: string[]
  language: string
}

export interface FollowUpRequest {
  findings: string
  impression: string
  modality: string
  language?: string
}

export interface FollowUpResponse {
  recommendations: Array<{
    study: string
    timeframe: string
    reason: string
  }>
  acr_appropriateness: string | null
  language: string
}

export interface ImpressionRequest {
  findings: string
  modality: string
  clinical_indication?: string
  language?: string
}

export interface ImpressionResponse {
  impression: string
  severity: string
  key_points: string[]
  language: string
}

export interface ICD10Request {
  findings: string
  impression: string
  language?: string
}

export interface ICD10Response {
  codes: Array<{
    code: string
    description: string
    relevance: string
  }>
  language: string
}

export async function suggestDifferential(request: DifferentialRequest): Promise<DifferentialResponse> {
  const url = `${base}/api/suggestions/differential`
  const res = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request)
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function suggestFollowup(request: FollowUpRequest): Promise<FollowUpResponse> {
  const url = `${base}/api/suggestions/followup`
  const res = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request)
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function generateImpressionFromFindings(request: ImpressionRequest): Promise<ImpressionResponse> {
  const url = `${base}/api/suggestions/impression`
  const res = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request)
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function suggestICD10(request: ICD10Request): Promise<ICD10Response> {
  const url = `${base}/api/suggestions/icd10`
  const res = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request)
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function quickSuggest(findings: string, suggestionType: 'differential' | 'followup' | 'impression' | 'icd10'): Promise<{ suggestion: string }> {
  const url = `${base}/api/suggestions/quick-suggest`
  const res = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ findings, suggestion_type: suggestionType })
  })
  if (!res.ok) throw new Error(await res.text())
=======
// Template Management API (Admin only)
export async function fetchAllTemplates(): Promise<TemplateDetail[]> {
  const res = await fetch(`${base}/admin/templates`, {
    headers: getAuthHeaders()
  })
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('Admin access required')
    }
    throw new Error(await res.text())
  }
  return res.json()
}

export async function getTemplate(templateId: string): Promise<TemplateDetail> {
  const res = await fetch(`${base}/templates/${templateId}`, {
    headers: getAuthHeaders()
  })
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('Admin access required')
    }
    throw new Error(await res.text())
  }
  return res.json()
}

export async function createTemplate(templateData: TemplateCreateRequest): Promise<TemplateDetail> {
  const res = await fetch(`${base}/admin/templates`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(templateData)
  })
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('Admin access required')
    }
    const errorText = await res.text()
    throw new Error(errorText || 'Failed to create template')
  }
  return res.json()
}

export async function updateTemplate(templateId: string, templateData: TemplateUpdateRequest): Promise<TemplateDetail> {
  const res = await fetch(`${base}/admin/templates/${templateId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(templateData)
  })
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('Admin access required')
    }
    throw new Error(await res.text())
  }
  return res.json()
}

export async function deleteTemplate(templateId: string): Promise<void> {
  const res = await fetch(`${base}/admin/templates/${templateId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('Admin access required')
    }
    throw new Error(await res.text())
  }
}

// Report History API
export async function fetchReportHistory(limit: number = 50, skip: number = 0): Promise<ReportHistory[]> {
  const res = await fetch(`${base}/reports/history?limit=${limit}&skip=${skip}`, {
    headers: getAuthHeaders()
  })
  if (!res.ok) {
    throw new Error(await res.text())
  }
  return res.json()
}

export async function fetchReportDetail(reportId: number): Promise<ReportDetail> {
  const res = await fetch(`${base}/reports/${reportId}`, {
    headers: getAuthHeaders()
  })
  if (!res.ok) {
    throw new Error(await res.text())
  }
>>>>>>> claude/admin-template-management-011CUtvK2niZyDKTAoaDcdRp
  return res.json()
}
