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
