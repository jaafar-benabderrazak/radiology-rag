const getApiBase = () => {
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
  return 'http://localhost:8000'
}

const base = getApiBase()
console.log('[API Config] Final API base URL:', base)

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
