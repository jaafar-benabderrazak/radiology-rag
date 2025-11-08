import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Landing() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  const handleGetStarted = () => {
    setAuthMode('register')
    setShowAuthModal(true)
  }

  const handleSignIn = () => {
    setAuthMode('login')
    setShowAuthModal(true)
  }

  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <div className="logo">
            <span className="logo-icon">📋</span>
            <span className="logo-text">RadiologyAI</span>
          </div>
          <div className="nav-actions">
            <button className="btn-nav" onClick={handleSignIn}>
              Sign In
            </button>
            <button className="btn-primary" onClick={handleGetStarted}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              AI-Powered Radiology Reports
              <span className="hero-gradient"> In Seconds</span>
            </h1>
            <p className="hero-subtitle">
              Transform clinical indications into comprehensive, structured radiology reports using advanced AI.
              Save time, improve consistency, and enhance patient care.
            </p>
            <div className="hero-stats">
              <div className="stat">
                <div className="stat-number">90%</div>
                <div className="stat-label">Time Saved</div>
              </div>
              <div className="stat">
                <div className="stat-number">10k+</div>
                <div className="stat-label">Reports Generated</div>
              </div>
              <div className="stat">
                <div className="stat-number">500+</div>
                <div className="stat-label">Radiologists</div>
              </div>
            </div>
            <div className="hero-cta">
              <button className="btn-hero" onClick={handleGetStarted}>
                Start Free Trial
              </button>
              <button className="btn-hero-secondary" onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
                Watch Demo
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-card">
              <div className="visual-header">
                <div className="visual-dots">
                  <span></span><span></span><span></span>
                </div>
                <span className="visual-title">Report Generation</span>
              </div>
              <div className="visual-content">
                <div className="visual-input">
                  <span className="icon">🎤</span>
                  <span>Patient with acute chest pain...</span>
                </div>
                <div className="visual-arrow">↓ AI Processing</div>
                <div className="visual-output">
                  <span className="icon">✨</span>
                  <span>Complete structured report ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="section-container">
          <h2 className="section-title">Powerful Features for Modern Radiology</h2>
          <p className="section-subtitle">Everything you need to streamline your radiology workflow</p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3 className="feature-title">AI-Powered Generation</h3>
              <p className="feature-description">
                Advanced Gemini 2.0 AI automatically generates comprehensive reports from clinical indications
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎤</div>
              <h3 className="feature-title">Voice Recognition</h3>
              <p className="feature-description">
                Dictate clinical findings naturally with real-time transcription in multiple languages
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3 className="feature-title">Multi-Language Support</h3>
              <p className="feature-description">
                Generate reports in French, English, or Arabic with automatic language detection
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3 className="feature-title">Template Library</h3>
              <p className="feature-description">
                Extensive library of specialty-specific templates for CT, MRI, X-Ray, and more
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3 className="feature-title">Smart Template Matching</h3>
              <p className="feature-description">
                AI automatically selects the best template using RAG and similar case analysis
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📄</div>
              <h3 className="feature-title">Export Options</h3>
              <p className="feature-description">
                Download reports in Word or PDF format with highlighting and formatting
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h3 className="feature-title">AI Validation</h3>
              <p className="feature-description">
                Automatic quality checks and validation to ensure report accuracy and completeness
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3 className="feature-title">Secure & Compliant</h3>
              <p className="feature-description">
                HIPAA-ready with encrypted data storage and role-based access control
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="demo">
        <div className="section-container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Simple, fast, and accurate - in just 3 steps</p>

          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3 className="step-title">Input Clinical Indication</h3>
                <p className="step-description">
                  Type or dictate the patient's symptoms, clinical history, and reason for examination
                </p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3 className="step-title">AI Selects Template</h3>
                <p className="step-description">
                  Our AI analyzes your input and automatically selects the most appropriate report template
                </p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3 className="step-title">Generate & Export</h3>
                <p className="step-description">
                  Receive a complete, structured report ready for review and export to your PACS or EMR
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="section-container">
          <h2 className="section-title">Trusted by Radiologists Worldwide</h2>
          <p className="section-subtitle">See what healthcare professionals are saying</p>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "RadiologyAI has transformed my workflow. I can now complete reports 3x faster while maintaining
                the same level of quality. The voice recognition is incredibly accurate."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">DR</div>
                <div className="author-info">
                  <div className="author-name">Dr. Robert Chen</div>
                  <div className="author-title">Radiologist, Stanford Medical Center</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "The multi-language support is a game-changer for our international practice. Our radiologists
                can now generate reports in French, English, or Arabic seamlessly."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">SM</div>
                <div className="author-info">
                  <div className="author-name">Dr. Sophie Martin</div>
                  <div className="author-title">Chief Radiologist, Hôpital Universitaire</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "The AI validation feature catches inconsistencies I might have missed. It's like having a second
                pair of eyes reviewing every report. Patient safety has improved significantly."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">JK</div>
                <div className="author-info">
                  <div className="author-name">Dr. James Kumar</div>
                  <div className="author-title">Interventional Radiologist, Mayo Clinic</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-container">
          <h2 className="cta-title">Ready to Transform Your Radiology Practice?</h2>
          <p className="cta-subtitle">
            Join hundreds of radiologists using AI to improve efficiency and patient care
          </p>
          <div className="cta-buttons">
            <button className="btn-cta" onClick={handleGetStarted}>
              Start Free Trial
            </button>
            <button className="btn-cta-secondary" onClick={handleSignIn}>
              Sign In
            </button>
          </div>
          <p className="cta-note">No credit card required • 14-day free trial • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <span className="logo-icon">📋</span>
                <span className="logo-text">RadiologyAI</span>
              </div>
              <p className="footer-description">
                Empowering radiologists with AI-powered report generation
              </p>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Product</h4>
              <ul className="footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#demo">How It Works</a></li>
                <li><a href="#pricing">Pricing</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Company</h4>
              <ul className="footer-links">
                <li><a href="#about">About Us</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><a href="#careers">Careers</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Legal</h4>
              <ul className="footer-links">
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
                <li><a href="#hipaa">HIPAA Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2024 RadiologyAI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAuthModal(false)}>×</button>
            <h2 className="auth-title">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="auth-subtitle">
              {authMode === 'login'
                ? 'Sign in to continue to RadiologyAI'
                : 'Start your free trial today'}
            </p>

            <div className="auth-notice">
              <p>⚠️ Authentication integration in progress</p>
              <p>For now, navigate directly to the app:</p>
              <button
                className="btn-primary"
                onClick={() => navigate('/app')}
                style={{ marginTop: '1rem', width: '100%' }}
              >
                Go to App
              </button>
            </div>

            <div className="auth-switch">
              {authMode === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <button onClick={() => setAuthMode('register')}>Sign up</button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button onClick={() => setAuthMode('login')}>Sign in</button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .landing {
          min-height: 100vh;
          background: #ffffff;
        }

        /* Navigation */
        .nav {
          position: sticky;
          top: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #e5e7eb;
          padding: 1rem 0;
          z-index: 100;
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.5rem;
          font-weight: 700;
          color: #667eea;
        }

        .logo-icon {
          font-size: 1.75rem;
        }

        .nav-actions {
          display: flex;
          gap: 1rem;
        }

        .btn-nav {
          padding: 0.5rem 1.5rem;
          border: none;
          background: transparent;
          color: #4b5563;
          font-weight: 600;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .btn-nav:hover {
          background: #f3f4f6;
        }

        .btn-primary {
          padding: 0.5rem 1.5rem;
          border: none;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: 600;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        /* Hero Section */
        .hero {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 6rem 2rem;
        }

        .hero-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }

        @media (max-width: 768px) {
          .hero-container {
            grid-template-columns: 1fr;
          }
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 1.5rem;
        }

        .hero-gradient {
          background: linear-gradient(to right, #fbbf24, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          line-height: 1.6;
          opacity: 0.95;
          margin-bottom: 2rem;
        }

        .hero-stats {
          display: flex;
          gap: 3rem;
          margin-bottom: 2rem;
        }

        .stat {
          text-align: center;
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: 800;
        }

        .stat-label {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .hero-cta {
          display: flex;
          gap: 1rem;
        }

        .btn-hero {
          padding: 1rem 2rem;
          border: none;
          background: white;
          color: #667eea;
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .btn-hero:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .btn-hero-secondary {
          padding: 1rem 2rem;
          border: 2px solid white;
          background: transparent;
          color: white;
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .btn-hero-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .hero-visual {
          display: flex;
          justify-content: center;
        }

        .visual-card {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 400px;
          width: 100%;
        }

        .visual-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .visual-dots {
          display: flex;
          gap: 0.4rem;
        }

        .visual-dots span {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #d1d5db;
        }

        .visual-title {
          color: #1f2937;
          font-weight: 600;
        }

        .visual-content {
          color: #1f2937;
        }

        .visual-input, .visual-output {
          padding: 1rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.95rem;
        }

        .visual-input {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
        }

        .visual-output {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
        }

        .visual-arrow {
          text-align: center;
          padding: 1rem 0;
          color: #667eea;
          font-weight: 600;
        }

        .icon {
          font-size: 1.5rem;
        }

        /* Sections */
        .section-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 5rem 2rem;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 800;
          text-align: center;
          margin-bottom: 1rem;
          color: #1f2937;
        }

        .section-subtitle {
          font-size: 1.25rem;
          text-align: center;
          color: #6b7280;
          margin-bottom: 4rem;
        }

        /* Features */
        .features {
          background: #f9fafb;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
        }

        .feature-card {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          transition: all 0.3s;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .feature-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #1f2937;
        }

        .feature-description {
          color: #6b7280;
          line-height: 1.6;
        }

        /* How It Works */
        .steps {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .step {
          display: flex;
          gap: 2rem;
          align-items: flex-start;
        }

        .step-number {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 800;
          flex-shrink: 0;
        }

        .step-content {
          flex: 1;
        }

        .step-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #1f2937;
        }

        .step-description {
          color: #6b7280;
          line-height: 1.6;
        }

        /* Testimonials */
        .testimonials {
          background: #f9fafb;
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
        }

        .testimonial-card {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .testimonial-stars {
          font-size: 1.25rem;
          margin-bottom: 1rem;
        }

        .testimonial-text {
          color: #4b5563;
          line-height: 1.6;
          margin-bottom: 1.5rem;
          font-style: italic;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .author-avatar {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .author-name {
          font-weight: 700;
          color: #1f2937;
        }

        .author-title {
          font-size: 0.9rem;
          color: #6b7280;
        }

        /* CTA */
        .cta {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .cta-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 5rem 2rem;
          text-align: center;
        }

        .cta-title {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 1rem;
        }

        .cta-subtitle {
          font-size: 1.25rem;
          margin-bottom: 2rem;
          opacity: 0.95;
        }

        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .btn-cta {
          padding: 1rem 2rem;
          border: none;
          background: white;
          color: #667eea;
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .btn-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .btn-cta-secondary {
          padding: 1rem 2rem;
          border: 2px solid white;
          background: transparent;
          color: white;
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .btn-cta-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .cta-note {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        /* Footer */
        .footer {
          background: #1f2937;
          color: #d1d5db;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem 2rem 2rem;
        }

        .footer-content {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 3rem;
          margin-bottom: 3rem;
        }

        @media (max-width: 768px) {
          .footer-content {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          margin-bottom: 1rem;
        }

        .footer-description {
          line-height: 1.6;
        }

        .footer-title {
          font-weight: 700;
          color: white;
          margin-bottom: 1rem;
        }

        .footer-links {
          list-style: none;
          padding: 0;
        }

        .footer-links li {
          margin-bottom: 0.75rem;
        }

        .footer-links a {
          color: #d1d5db;
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-links a:hover {
          color: white;
        }

        .footer-bottom {
          border-top: 1px solid #374151;
          padding-top: 2rem;
          text-align: center;
        }

        /* Auth Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .auth-modal {
          background: white;
          border-radius: 16px;
          padding: 3rem;
          max-width: 450px;
          width: 90%;
          position: relative;
        }

        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 2rem;
          color: #9ca3af;
          cursor: pointer;
        }

        .auth-title {
          font-size: 2rem;
          font-weight: 800;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .auth-subtitle {
          color: #6b7280;
          margin-bottom: 2rem;
        }

        .auth-notice {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          padding: 1.5rem;
          border-radius: 8px;
          text-align: center;
          color: #92400e;
        }

        .auth-notice p {
          margin: 0.5rem 0;
        }

        .auth-switch {
          text-align: center;
          margin-top: 2rem;
          color: #6b7280;
        }

        .auth-switch button {
          background: none;
          border: none;
          color: #667eea;
          font-weight: 600;
          cursor: pointer;
        }

        .auth-switch button:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
