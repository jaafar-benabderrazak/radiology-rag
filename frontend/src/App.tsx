import { useState } from "react"
import { generate } from "./lib/api"

export default function App() {
  const [text, setText] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const onRun = async () => {
    setLoading(true)
    try { setResult(await generate(text)) } finally { setLoading(false) }
  }
  return (
    <div style={{ maxWidth: 800, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>Radiology RAG Demo</h1>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Paste clinical text..."
        style={{ width: "100%", height: 160 }}
      />
      <div style={{ marginTop: 12 }}>
        <button onClick={onRun} disabled={loading || !text}>
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>
      {result && (
        <pre style={{ whiteSpace: "pre-wrap", background: "#f7f7f7", padding: 12, marginTop: 16 }}>
{result.report}
        </pre>
      )}
    </div>
  )
}
