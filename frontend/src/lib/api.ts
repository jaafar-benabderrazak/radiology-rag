const base = import.meta.env.VITE_API_BASE || (typeof window !== 'undefined'
  ? (window as any).__API_BASE__ || 'http://localhost:8000'
  : 'http://localhost:8000')

export async function generate(input: string) {
  const body = {
    input,
    templateId: "auto",
    meta: { hospitalName: "Demo Hospital", doctorName: "Dr. Smith" }
  }
  const res = await fetch(`${base}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
