import { useState } from 'react'
import type {
  DifferentialRequest,
  DifferentialResponse,
  FollowUpRequest,
  FollowUpResponse,
  ImpressionRequest,
  ImpressionResponse,
  ICD10Request,
  ICD10Response
} from '../lib/api'
import * as api from '../lib/api'

interface AISuggestionsProps {
  findings: string
  impression?: string
  modality?: string
  clinicalContext?: string
}

export default function AISuggestions({
  findings,
  impression = '',
  modality = '',
  clinicalContext = ''
}: AISuggestionsProps) {
  const [activeTab, setActiveTab] = useState<'differential' | 'followup' | 'impression' | 'icd10'>('differential')
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState<'en' | 'fr'>('en')

  // Results state
  const [differentialResult, setDifferentialResult] = useState<DifferentialResponse | null>(null)
  const [followupResult, setFollowupResult] = useState<FollowUpResponse | null>(null)
  const [impressionResult, setImpressionResult] = useState<ImpressionResponse | null>(null)
  const [icd10Result, setIcd10Result] = useState<ICD10Response | null>(null)

  const getSuggestions = async (type: typeof activeTab) => {
    if (!findings.trim()) {
      alert('Please enter findings first')
      return
    }

    setLoading(true)
    try {
      switch (type) {
        case 'differential': {
          const request: DifferentialRequest = {
            findings,
            modality: modality || undefined,
            clinical_context: clinicalContext || undefined,
            language
          }
          const result = await api.suggestDifferential(request)
          setDifferentialResult(result)
          break
        }

        case 'followup': {
          if (!impression.trim()) {
            alert('Please provide an impression for follow-up recommendations')
            setLoading(false)
            return
          }
          const request: FollowUpRequest = {
            findings,
            impression,
            modality: modality || 'Unknown',
            language
          }
          const result = await api.suggestFollowup(request)
          setFollowupResult(result)
          break
        }

        case 'impression': {
          const request: ImpressionRequest = {
            findings,
            modality: modality || 'Unknown',
            clinical_indication: clinicalContext || undefined,
            language
          }
          const result = await api.generateImpressionFromFindings(request)
          setImpressionResult(result)
          break
        }

        case 'icd10': {
          if (!impression.trim()) {
            alert('Please provide an impression for ICD-10 code suggestions')
            setLoading(false)
            return
          }
          const request: ICD10Request = {
            findings,
            impression,
            language
          }
          const result = await api.suggestICD10(request)
          setIcd10Result(result)
          break
        }
      }
    } catch (error) {
      console.error('Failed to get suggestions:', error)
      alert('Failed to get AI suggestions: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <div className="ai-suggestions-panel">
      <div className="panel-header">
        <h2 className="panel-title">AI Clinical Suggestions</h2>
        <select
          className="language-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'en' | 'fr')}
        >
          <option value="en">English</option>
          <option value="fr">Français</option>
        </select>
      </div>

      <div className="tabs-container">
        <button
          className={`tab ${activeTab === 'differential' ? 'active' : ''}`}
          onClick={() => setActiveTab('differential')}
        >
          Differential Dx
        </button>
        <button
          className={`tab ${activeTab === 'followup' ? 'active' : ''}`}
          onClick={() => setActiveTab('followup')}
        >
          Follow-up
        </button>
        <button
          className={`tab ${activeTab === 'impression' ? 'active' : ''}`}
          onClick={() => setActiveTab('impression')}
        >
          Impression
        </button>
        <button
          className={`tab ${activeTab === 'icd10' ? 'active' : ''}`}
          onClick={() => setActiveTab('icd10')}
        >
          ICD-10
        </button>
      </div>

      <div className="suggestions-content">
        {/* Differential Diagnosis Tab */}
        {activeTab === 'differential' && (
          <div className="suggestion-section">
            <p className="section-description">
              Get AI-powered differential diagnoses based on imaging findings and clinical context.
            </p>
            <button
              className="btn-generate"
              onClick={() => getSuggestions('differential')}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Differential Diagnosis'}
            </button>

            {differentialResult && (
              <div className="results-container">
                <h3 className="results-title">Differential Diagnoses:</h3>
                <div className="differentials-list">
                  {differentialResult.differentials.map((diff, idx) => (
                    <div key={idx} className="differential-item">
                      <div className="diff-header">
                        <span className="diff-diagnosis">{diff.diagnosis}</span>
                        <span className={`diff-probability ${diff.probability.toLowerCase().replace(' ', '-')}`}>
                          {diff.probability}
                        </span>
                      </div>
                      <p className="diff-reasoning">{diff.reasoning}</p>
                    </div>
                  ))}
                </div>

                {differentialResult.additional_workup.length > 0 && (
                  <div className="workup-section">
                    <h4>Recommended Additional Workup:</h4>
                    <ul className="workup-list">
                      {differentialResult.additional_workup.map((workup, idx) => (
                        <li key={idx}>{workup}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Follow-up Recommendations Tab */}
        {activeTab === 'followup' && (
          <div className="suggestion-section">
            <p className="section-description">
              Get evidence-based follow-up imaging recommendations with timeframes.
            </p>
            <button
              className="btn-generate"
              onClick={() => getSuggestions('followup')}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Follow-up Recommendations'}
            </button>

            {followupResult && (
              <div className="results-container">
                <h3 className="results-title">Follow-up Recommendations:</h3>
                <div className="recommendations-list">
                  {followupResult.recommendations.map((rec, idx) => (
                    <div key={idx} className="recommendation-item">
                      <div className="rec-header">
                        <span className="rec-study">{rec.study}</span>
                        <span className="rec-timeframe">{rec.timeframe}</span>
                      </div>
                      <p className="rec-reason">{rec.reason}</p>
                    </div>
                  ))}
                </div>

                {followupResult.acr_appropriateness && (
                  <div className="acr-section">
                    <h4>ACR Appropriateness Criteria:</h4>
                    <p>{followupResult.acr_appropriateness}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Impression Generation Tab */}
        {activeTab === 'impression' && (
          <div className="suggestion-section">
            <p className="section-description">
              Generate a concise impression from your detailed findings.
            </p>
            <button
              className="btn-generate"
              onClick={() => getSuggestions('impression')}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Impression'}
            </button>

            {impressionResult && (
              <div className="results-container">
                <div className="impression-header">
                  <h3 className="results-title">Generated Impression:</h3>
                  <span className={`severity-badge ${impressionResult.severity}`}>
                    {impressionResult.severity}
                  </span>
                </div>

                <div className="impression-text">
                  <p>{impressionResult.impression}</p>
                  <button
                    className="btn-copy"
                    onClick={() => copyToClipboard(impressionResult.impression)}
                  >
                    Copy to Clipboard
                  </button>
                </div>

                {impressionResult.key_points.length > 0 && (
                  <div className="key-points-section">
                    <h4>Key Points:</h4>
                    <ul className="key-points-list">
                      {impressionResult.key_points.map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ICD-10 Codes Tab */}
        {activeTab === 'icd10' && (
          <div className="suggestion-section">
            <p className="section-description">
              Get relevant ICD-10 diagnostic codes for billing and documentation.
            </p>
            <button
              className="btn-generate"
              onClick={() => getSuggestions('icd10')}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Suggest ICD-10 Codes'}
            </button>

            {icd10Result && (
              <div className="results-container">
                <h3 className="results-title">Suggested ICD-10 Codes:</h3>
                <div className="icd10-list">
                  {icd10Result.codes.map((codeItem, idx) => (
                    <div key={idx} className="icd10-item">
                      <div className="icd10-header">
                        <span className="icd10-code">{codeItem.code}</span>
                        <span className={`icd10-relevance ${codeItem.relevance}`}>
                          {codeItem.relevance}
                        </span>
                      </div>
                      <p className="icd10-description">{codeItem.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .ai-suggestions-panel {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .panel-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }

        .language-select {
          padding: 0.5rem;
          border: 2px solid white;
          border-radius: 6px;
          background: transparent;
          color: white;
          font-weight: 600;
          cursor: pointer;
        }

        .language-select option {
          color: #2d3748;
        }

        .tabs-container {
          display: flex;
          background: #f7fafc;
          border-bottom: 2px solid #e2e8f0;
        }

        .tab {
          flex: 1;
          padding: 1rem;
          background: transparent;
          border: none;
          font-weight: 600;
          color: #718096;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 3px solid transparent;
        }

        .tab:hover {
          background: #edf2f7;
        }

        .tab.active {
          color: #667eea;
          border-bottom-color: #667eea;
          background: white;
        }

        .suggestions-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .suggestion-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .section-description {
          color: #718096;
          font-size: 0.95rem;
          line-height: 1.5;
          margin: 0;
        }

        .btn-generate {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-generate:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .btn-generate:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .results-container {
          margin-top: 1rem;
          padding: 1.5rem;
          background: #f7fafc;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }

        .results-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 1rem 0;
        }

        /* Differential Diagnosis Styles */
        .differentials-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .differential-item {
          background: white;
          padding: 1rem;
          border-radius: 6px;
          border-left: 3px solid #667eea;
        }

        .diff-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .diff-diagnosis {
          font-weight: 600;
          color: #2d3748;
          font-size: 1rem;
        }

        .diff-probability {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .diff-probability.most-likely {
          background: #c6f6d5;
          color: #22543d;
        }

        .diff-probability.likely {
          background: #bee3f8;
          color: #2c5282;
        }

        .diff-probability.possible {
          background: #feebc8;
          color: #7c2d12;
        }

        .diff-reasoning {
          color: #4a5568;
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0;
        }

        .workup-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 2px solid #e2e8f0;
        }

        .workup-section h4 {
          font-size: 1rem;
          color: #2d3748;
          margin: 0 0 0.75rem 0;
        }

        .workup-list {
          margin: 0;
          padding-left: 1.5rem;
          color: #4a5568;
        }

        .workup-list li {
          margin-bottom: 0.5rem;
        }

        /* Follow-up Recommendations Styles */
        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .recommendation-item {
          background: white;
          padding: 1rem;
          border-radius: 6px;
          border-left: 3px solid #48bb78;
        }

        .rec-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .rec-study {
          font-weight: 600;
          color: #2d3748;
        }

        .rec-timeframe {
          padding: 0.25rem 0.75rem;
          background: #bee3f8;
          color: #2c5282;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .rec-reason {
          color: #4a5568;
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0;
        }

        .acr-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 2px solid #e2e8f0;
        }

        .acr-section h4 {
          font-size: 1rem;
          color: #2d3748;
          margin: 0 0 0.5rem 0;
        }

        .acr-section p {
          color: #4a5568;
          line-height: 1.5;
          margin: 0;
        }

        /* Impression Styles */
        .impression-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .severity-badge {
          padding: 0.5rem 1rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .severity-badge.normal {
          background: #c6f6d5;
          color: #22543d;
        }

        .severity-badge.mild {
          background: #bee3f8;
          color: #2c5282;
        }

        .severity-badge.moderate {
          background: #feebc8;
          color: #7c2d12;
        }

        .severity-badge.severe {
          background: #fed7d7;
          color: #742a2a;
        }

        .severity-badge.critical {
          background: #fc8181;
          color: white;
        }

        .impression-text {
          background: white;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          position: relative;
        }

        .impression-text p {
          color: #2d3748;
          line-height: 1.6;
          margin: 0 0 1rem 0;
        }

        .btn-copy {
          padding: 0.5rem 1rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .btn-copy:hover {
          background: #5568d3;
        }

        .key-points-section {
          padding-top: 1rem;
          border-top: 2px solid #e2e8f0;
        }

        .key-points-section h4 {
          font-size: 1rem;
          color: #2d3748;
          margin: 0 0 0.75rem 0;
        }

        .key-points-list {
          margin: 0;
          padding-left: 1.5rem;
          color: #4a5568;
        }

        .key-points-list li {
          margin-bottom: 0.5rem;
        }

        /* ICD-10 Styles */
        .icd10-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .icd10-item {
          background: white;
          padding: 1rem;
          border-radius: 6px;
          border-left: 3px solid #ed8936;
        }

        .icd10-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .icd10-code {
          font-weight: 700;
          color: #2d3748;
          font-family: 'Courier New', monospace;
          font-size: 1rem;
        }

        .icd10-relevance {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .icd10-relevance.primary {
          background: #c6f6d5;
          color: #22543d;
        }

        .icd10-relevance.secondary {
          background: #bee3f8;
          color: #2c5282;
        }

        .icd10-relevance.differential {
          background: #feebc8;
          color: #7c2d12;
        }

        .icd10-description {
          color: #4a5568;
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0;
        }
      `}</style>
    </div>
  )
}
