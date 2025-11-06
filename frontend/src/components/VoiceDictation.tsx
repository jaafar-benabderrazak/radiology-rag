import { useState, useRef, useEffect } from 'react'

interface VoiceDictationProps {
  onTranscription: (text: string) => void
  language?: string
  specialty?: string
}

export default function VoiceDictation({
  onTranscription,
  language = 'auto',
  specialty = 'radiology'
}: VoiceDictationProps) {
  const [isRecording, isSetRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (timerRef.current) clearInterval(timerRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (audioContextRef.current) audioContextRef.current.close()
    }
  }, [])

  const startRecording = async () => {
    try {
      setError(null)

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Set up audio level monitoring
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)

      analyser.fftSize = 256
      microphone.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      // Start monitoring audio levels
      monitorAudioLevel()

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        if (audioContextRef.current) {
          audioContextRef.current.close()
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }

        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })

        // Send for transcription
        await transcribeAudio(audioBlob)

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      // Start recording
      mediaRecorder.start()
      isSetRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

    } catch (err: any) {
      console.error('Error starting recording:', err)
      setError(err.message || 'Failed to access microphone')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      isSetRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

    const checkLevel = () => {
      if (!analyserRef.current) return

      analyserRef.current.getByteFrequencyData(dataArray)

      // Calculate average audio level
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      const normalizedLevel = Math.min(average / 128, 1)

      setAudioLevel(normalizedLevel)

      animationRef.current = requestAnimationFrame(checkLevel)
    }

    checkLevel()
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true)
    setError(null)

    try {
      // Get access token
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      // Create form data
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('language', language)
      formData.append('specialty', specialty)

      // Send to backend
      const response = await fetch('http://localhost:8000/api/voice/transcribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Transcription failed')
      }

      const result = await response.json()

      if (result.success && result.text) {
        onTranscription(result.text)
      } else {
        throw new Error(result.error || 'No transcription result')
      }

    } catch (err: any) {
      console.error('Transcription error:', err)
      setError(err.message || 'Failed to transcribe audio')
    } finally {
      setIsTranscribing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="voice-dictation">
      <div className="voice-header">
        <span className="voice-icon">🎤</span>
        <h3>Voice Dictation</h3>
      </div>

      {error && (
        <div className="voice-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="voice-controls">
        {!isRecording && !isTranscribing && (
          <button
            className="voice-button start"
            onClick={startRecording}
            disabled={isTranscribing}
          >
            <span className="button-icon">⏺</span>
            <span>Start Recording</span>
          </button>
        )}

        {isRecording && (
          <>
            <div className="recording-indicator">
              <div className="recording-dot"></div>
              <span className="recording-text">Recording: {formatTime(recordingTime)}</span>
            </div>

            <div className="audio-visualizer">
              <div
                className="audio-level-bar"
                style={{ width: `${audioLevel * 100}%` }}
              ></div>
            </div>

            <button
              className="voice-button stop"
              onClick={stopRecording}
            >
              <span className="button-icon">⏹</span>
              <span>Stop & Transcribe</span>
            </button>
          </>
        )}

        {isTranscribing && (
          <div className="transcribing-indicator">
            <div className="spinner"></div>
            <span>Transcribing audio...</span>
          </div>
        )}
      </div>

      <style>{`
        .voice-dictation {
          background: var(--card-bg);
          border: 2px solid var(--border-color);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }

        .voice-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .voice-icon {
          font-size: 1.5rem;
        }

        .voice-header h3 {
          margin: 0;
          font-size: 1.1rem;
          color: var(--text-primary);
        }

        .voice-error {
          background: var(--error-bg);
          color: var(--error-text);
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .voice-controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .voice-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          min-width: 200px;
          justify-content: center;
        }

        .voice-button.start {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
        }

        .voice-button.start:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
        }

        .voice-button.stop {
          background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
          color: white;
        }

        .voice-button.stop:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(245, 101, 101, 0.4);
        }

        .voice-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .button-icon {
          font-size: 1.2rem;
        }

        .recording-indicator {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
          border-radius: 8px;
        }

        .recording-dot {
          width: 12px;
          height: 12px;
          background: #e53e3e;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }

        .recording-text {
          font-weight: 600;
          color: #742a2a;
        }

        .audio-visualizer {
          width: 100%;
          max-width: 300px;
          height: 40px;
          background: var(--card-bg-secondary);
          border-radius: 8px;
          overflow: hidden;
          position: relative;
        }

        .audio-level-bar {
          height: 100%;
          background: linear-gradient(90deg, #48bb78 0%, #38a169 100%);
          transition: width 0.1s ease-out;
        }

        .transcribing-indicator {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1.5rem;
          background: var(--card-bg-secondary);
          border-radius: 8px;
          color: var(--text-secondary);
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid var(--border-color);
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .voice-button {
            min-width: 100%;
          }

          .audio-visualizer {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
