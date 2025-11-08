import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AnimatedWorkflow from '../components/AnimatedWorkflow'

type Language = 'en' | 'fr'

const translations = {
  en: {
    appName: 'VitaScribe',
    tagline: 'Stop Drowning in Reports.',
    taglineHighlight: 'Start Caring for Patients.',
    heroSubtitle: 'VitaScribe is your AI-powered radiology scribe that transforms clinical indications into comprehensive reports in seconds. Because you became a radiologist to diagnose and heal, not to battle documentation backlogs.',
    signIn: 'Sign In',
    getStarted: 'Get Started Free',
    startFreeTrial: 'Try Free for 14 Days',
    watchDemo: 'See How It Works',
    features: 'Your Voice. Your Reports. Your Scribe.',
    featuresSubtitle: 'VitaScribe adapts to how you work, delivering precision, speed, and peace of mind',
    howItWorks: 'Transform Your Workflow',
    howItWorksSubtitle: 'From clinical indication to comprehensive report in seconds',
    testimonials: 'Trusted by Healthcare Professionals',
    testimonialsSubtitle: 'Join radiologists who\'ve reclaimed their time and passion for patient care',
    ctaTitle: 'Your Peace of Mind is Priceless',
    ctaSubtitle: 'Whether you\'re drowning in documentation, need increased precision, or simply want more time with patients, VitaScribe adapts to how you work',
    ctaNote: 'No credit card required • HIPAA compliant • Cancel anytime',
    welcomeBack: 'Welcome Back',
    createAccount: 'Create Account',
    signInSubtitle: 'Sign in to continue to VitaScribe',
    createAccountSubtitle: 'Start your free trial today',
    email: 'Email',
    password: 'Password',
    username: 'Username',
    fullName: 'Full Name',
    hospital: 'Hospital (Optional)',
    pleaseWait: 'Please wait...',
    demoCredentials: 'Demo credentials',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    signUp: 'Sign up',
    stats: {
      timeSaved: 'Hours Saved Weekly',
      reports: 'Documentation Backlog',
      radiologists: 'Faster Reports'
    },
    featuresList: {
      aiPowered: {
        title: 'AI-Powered Generation',
        desc: 'Advanced Gemini 2.0 AI automatically generates comprehensive reports from clinical indications'
      },
      voice: {
        title: 'Voice Recognition',
        desc: 'Dictate clinical findings naturally with real-time transcription in multiple languages'
      },
      multilang: {
        title: 'Multi-Language Support',
        desc: 'Generate reports in French, English, or Arabic with automatic language detection'
      },
      templates: {
        title: 'Template Library',
        desc: 'Extensive library of specialty-specific templates for CT, MRI, X-Ray, and more'
      },
      matching: {
        title: 'Smart Template Matching',
        desc: 'AI automatically selects the best template using RAG and similar case analysis'
      },
      export: {
        title: 'Export Options',
        desc: 'Download reports in Word or PDF format with highlighting and formatting'
      },
      validation: {
        title: 'AI Validation',
        desc: 'Automatic quality checks and validation to ensure report accuracy and completeness'
      },
      secure: {
        title: 'Secure & Compliant',
        desc: 'HIPAA-ready with encrypted data storage and role-based access control'
      }
    },
    steps: {
      step1: {
        title: 'Input Clinical Indication',
        desc: "Type or dictate the patient's symptoms, clinical history, and reason for examination"
      },
      step2: {
        title: 'AI Selects Template',
        desc: 'Our AI analyzes your input and automatically selects the most appropriate report template'
      },
      step3: {
        title: 'Generate & Export',
        desc: 'Receive a complete, structured report ready for review and export to your PACS or EMR'
      }
    }
  },
  fr: {
    appName: 'VitaScribe',
    tagline: 'Arrêtez de Vous Noyer dans les Rapports.',
    taglineHighlight: 'Concentrez-vous sur les Patients.',
    heroSubtitle: "VitaScribe est votre assistant IA qui transforme les indications cliniques en rapports complets en quelques secondes. Parce que vous êtes devenu radiologue pour diagnostiquer et soigner, pas pour combattre les retards de documentation.",
    signIn: 'Se Connecter',
    getStarted: 'Commencer Gratuitement',
    startFreeTrial: 'Essai Gratuit 14 Jours',
    watchDemo: 'Voir Comment Ça Marche',
    features: 'Votre Voix. Vos Rapports. Votre Assistant.',
    featuresSubtitle: 'VitaScribe s\'adapte à votre façon de travailler, offrant précision, rapidité et tranquillité d\'esprit',
    howItWorks: 'Transformez Votre Flux de Travail',
    howItWorksSubtitle: 'De l\'indication clinique au rapport complet en quelques secondes',
    testimonials: 'Approuvé par les Professionnels de Santé',
    testimonialsSubtitle: 'Rejoignez les radiologues qui ont retrouvé leur temps et leur passion pour les soins aux patients',
    ctaTitle: 'Votre Tranquillité d\'Esprit N\'a Pas de Prix',
    ctaSubtitle: 'Que vous soyez submergé par la documentation, que vous ayez besoin de plus de précision ou simplement de plus de temps avec les patients, VitaScribe s\'adapte à vous',
    ctaNote: 'Aucune carte bancaire • Conforme HIPAA • Annulation à tout moment',
    welcomeBack: 'Bienvenue',
    createAccount: 'Créer un Compte',
    signInSubtitle: 'Connectez-vous pour continuer sur VitaScribe',
    createAccountSubtitle: 'Commencez votre essai gratuit aujourd\'hui',
    email: 'Email',
    password: 'Mot de passe',
    username: "Nom d'utilisateur",
    fullName: 'Nom complet',
    hospital: 'Hôpital (Optionnel)',
    pleaseWait: 'Veuillez patienter...',
    demoCredentials: 'Identifiants de démo',
    noAccount: "Vous n'avez pas de compte?",
    hasAccount: 'Vous avez déjà un compte?',
    signUp: "S'inscrire",
    stats: {
      timeSaved: 'Heures Gagnées/Semaine',
      reports: 'Retard de Documentation',
      radiologists: 'Rapports Plus Rapides'
    },
    featuresList: {
      aiPowered: {
        title: 'Génération par IA',
        desc: "L'IA Gemini 2.0 génère automatiquement des rapports complets à partir des indications cliniques"
      },
      voice: {
        title: 'Reconnaissance Vocale',
        desc: 'Dictez naturellement les observations cliniques avec transcription en temps réel en plusieurs langues'
      },
      multilang: {
        title: 'Support Multilingue',
        desc: 'Générez des rapports en français, anglais ou arabe avec détection automatique de la langue'
      },
      templates: {
        title: 'Bibliothèque de Modèles',
        desc: 'Vaste bibliothèque de modèles spécifiques pour TDM, IRM, radiographie et plus encore'
      },
      matching: {
        title: 'Correspondance Intelligente',
        desc: "L'IA sélectionne automatiquement le meilleur modèle grâce au RAG et à l'analyse de cas similaires"
      },
      export: {
        title: "Options d'Export",
        desc: 'Téléchargez les rapports en format Word ou PDF avec mise en évidence et formatage'
      },
      validation: {
        title: 'Validation par IA',
        desc: "Contrôles de qualité automatiques pour garantir l'exactitude et l'exhaustivité des rapports"
      },
      secure: {
        title: 'Sécurisé & Conforme',
        desc: 'Conforme HIPAA avec stockage crypté et contrôle d\'accès basé sur les rôles'
      }
    },
    steps: {
      step1: {
        title: 'Saisir l\'Indication Clinique',
        desc: 'Tapez ou dictez les symptômes du patient, les antécédents cliniques et la raison de l\'examen'
      },
      step2: {
        title: 'L\'IA Sélectionne le Modèle',
        desc: 'Notre IA analyse votre saisie et sélectionne automatiquement le modèle de rapport le plus approprié'
      },
      step3: {
        title: 'Générer & Exporter',
        desc: 'Recevez un rapport complet et structuré prêt pour révision et export vers votre PACS ou DME'
      }
    }
  }
}

export default function Landing() {
  const navigate = useNavigate()
  const { user, login, register } = useAuth()
  const [language, setLanguage] = useState<Language>('en')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  // Auth form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const t = translations[language]

  const handleGetStarted = () => {
    setAuthMode('register')
    setShowAuthModal(true)
    setError('')
  }

  const handleSignIn = () => {
    setAuthMode('login')
    setShowAuthModal(true)
    setError('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      setShowAuthModal(false)
      navigate('/app')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register({
        email,
        username,
        full_name: fullName,
        password,
        hospital_name: hospitalName
      })
      setShowAuthModal(false)
      navigate('/app')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <div className="logo">
            <span className="logo-icon">🏥</span>
            <span className="logo-text">{t.appName}</span>
          </div>
          <div className="nav-actions">
            <select
              className="language-selector-nav"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
            >
              <option value="en">🇬🇧 English</option>
              <option value="fr">🇫🇷 Français</option>
            </select>
            <button className="btn-nav" onClick={handleSignIn}>
              {t.signIn}
            </button>
            <button className="btn-primary" onClick={handleGetStarted}>
              {t.getStarted}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="animated-bg">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>
        <div className="hero-container">
          <div className="hero-content">
            <div className="badge">✨ Powered by Gemini 2.0 AI</div>
            <h1 className="hero-title animate-fade-in">
              {t.tagline}
              <span className="hero-gradient"> {t.taglineHighlight}</span>
            </h1>
            <p className="hero-subtitle animate-fade-in-delay">
              {t.heroSubtitle}
            </p>
            <div className="hero-stats animate-slide-up">
              <div className="stat">
                <div className="stat-number">8+</div>
                <div className="stat-label">{t.stats.timeSaved}</div>
              </div>
              <div className="stat">
                <div className="stat-number">Zero</div>
                <div className="stat-label">{t.stats.reports}</div>
              </div>
              <div className="stat">
                <div className="stat-number">6x</div>
                <div className="stat-label">{t.stats.radiologists}</div>
              </div>
            </div>
            <div className="hero-cta animate-slide-up-delay">
              <button className="btn-hero pulse" onClick={handleGetStarted}>
                {t.startFreeTrial}
              </button>
              <button className="btn-hero-secondary" onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
                {t.watchDemo}
              </button>
            </div>
          </div>
          <div className="hero-visual animate-slide-left">
            <div className="visual-card floating">
              <div className="visual-header">
                <div className="visual-dots">
                  <span className="dot-green"></span><span className="dot-yellow"></span><span className="dot-red"></span>
                </div>
                <span className="visual-title">Report Generation</span>
              </div>
              <div className="visual-content">
                <div className="visual-input typing">
                  <span className="icon">🎤</span>
                  <span>Patient with acute chest pain...</span>
                </div>
                <div className="visual-arrow">
                  <div className="processing-dots">
                    <span></span><span></span><span></span>
                  </div>
                  ↓ AI Processing
                </div>
                <div className="visual-output success-pulse">
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
          <h2 className="section-title">{t.features}</h2>
          <p className="section-subtitle">{t.featuresSubtitle}</p>

          <div className="features-grid">
            <div className="feature-card hover-lift">
              <div className="feature-icon">🤖</div>
              <h3 className="feature-title">{t.featuresList.aiPowered.title}</h3>
              <p className="feature-description">{t.featuresList.aiPowered.desc}</p>
            </div>

            <div className="feature-card hover-lift">
              <div className="feature-icon">🎤</div>
              <h3 className="feature-title">{t.featuresList.voice.title}</h3>
              <p className="feature-description">{t.featuresList.voice.desc}</p>
            </div>

            <div className="feature-card hover-lift">
              <div className="feature-icon">🌍</div>
              <h3 className="feature-title">{t.featuresList.multilang.title}</h3>
              <p className="feature-description">{t.featuresList.multilang.desc}</p>
            </div>

            <div className="feature-card hover-lift">
              <div className="feature-icon">📚</div>
              <h3 className="feature-title">{t.featuresList.templates.title}</h3>
              <p className="feature-description">{t.featuresList.templates.desc}</p>
            </div>

            <div className="feature-card hover-lift">
              <div className="feature-icon">🔍</div>
              <h3 className="feature-title">{t.featuresList.matching.title}</h3>
              <p className="feature-description">{t.featuresList.matching.desc}</p>
            </div>

            <div className="feature-card hover-lift">
              <div className="feature-icon">📄</div>
              <h3 className="feature-title">{t.featuresList.export.title}</h3>
              <p className="feature-description">{t.featuresList.export.desc}</p>
            </div>

            <div className="feature-card hover-lift">
              <div className="feature-icon">✅</div>
              <h3 className="feature-title">{t.featuresList.validation.title}</h3>
              <p className="feature-description">{t.featuresList.validation.desc}</p>
            </div>

            <div className="feature-card hover-lift">
              <div className="feature-icon">🔐</div>
              <h3 className="feature-title">{t.featuresList.secure.title}</h3>
              <p className="feature-description">{t.featuresList.secure.desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Animated Workflow */}
      <div id="demo">
        <AnimatedWorkflow language={language} />
      </div>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="section-container">
          <h2 className="section-title">{t.testimonials}</h2>
          <p className="section-subtitle">{t.testimonialsSubtitle}</p>

          <div className="testimonials-grid">
            <div className="testimonial-card hover-lift">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                {language === 'fr'
                  ? "VitaScribe a transformé mon flux de travail. Je peux maintenant terminer des rapports 3x plus rapidement tout en maintenant le même niveau de qualité. La reconnaissance vocale est incroyablement précise."
                  : "VitaScribe has transformed my workflow. I can now complete reports 3x faster while maintaining the same level of quality. The voice recognition is incredibly accurate."
                }
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">DR</div>
                <div className="author-info">
                  <div className="author-name">Dr. Robert Chen</div>
                  <div className="author-title">Radiologist, Stanford Medical Center</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card hover-lift">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                {language === 'fr'
                  ? "Le support multilingue est révolutionnaire pour notre pratique internationale. Nos radiologues peuvent désormais générer des rapports en français, anglais ou arabe de manière transparente."
                  : "The multi-language support is a game-changer for our international practice. Our radiologists can now generate reports in French, English, or Arabic seamlessly."
                }
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">SM</div>
                <div className="author-info">
                  <div className="author-name">Dr. Sophie Martin</div>
                  <div className="author-title">Chief Radiologist, Hôpital Universitaire</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card hover-lift">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                {language === 'fr'
                  ? "La fonction de validation IA détecte les incohérences que j'aurais pu manquer. C'est comme avoir une seconde paire d'yeux qui vérifie chaque rapport. La sécurité des patients s'est considérablement améliorée."
                  : "The AI validation feature catches inconsistencies I might have missed. It's like having a second pair of eyes reviewing every report. Patient safety has improved significantly."
                }
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
        <div className="animated-bg">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
        </div>
        <div className="cta-container">
          <h2 className="cta-title">{t.ctaTitle}</h2>
          <p className="cta-subtitle">{t.ctaSubtitle}</p>
          <div className="cta-buttons">
            <button className="btn-cta pulse" onClick={handleGetStarted}>
              {t.startFreeTrial}
            </button>
            <button className="btn-cta-secondary" onClick={handleSignIn}>
              {t.signIn}
            </button>
          </div>
          <p className="cta-note">{t.ctaNote}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <span className="logo-icon">🏥</span>
                <span className="logo-text">{t.appName}</span>
              </div>
              <p className="footer-description">
                {language === 'fr'
                  ? "Autonomiser les radiologues avec la génération de rapports assistée par IA"
                  : "Empowering radiologists with AI-powered report generation"
                }
              </p>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Product</h4>
              <ul className="footer-links">
                <li><Link to="/product/features">Features</Link></li>
                <li><Link to="/product/how-it-works">How It Works</Link></li>
                <li><Link to="/product/pricing">Pricing</Link></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Company</h4>
              <ul className="footer-links">
                <li><Link to="/company/about">About Us</Link></li>
                <li><Link to="/company/contact">Contact</Link></li>
                <li><Link to="/company/careers">Careers</Link></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Legal</h4>
              <ul className="footer-links">
                <li><Link to="/legal/privacy">Privacy Policy</Link></li>
                <li><Link to="/legal/terms">Terms of Service</Link></li>
                <li><Link to="/legal/hipaa">HIPAA Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2024 {t.appName}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAuthModal(false)}>×</button>
            <h2 className="auth-title">
              {authMode === 'login' ? t.welcomeBack : t.createAccount}
            </h2>
            <p className="auth-subtitle">
              {authMode === 'login' ? t.signInSubtitle : t.createAccountSubtitle}
            </p>

            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="auth-form">
              <div className="form-field">
                <label className="form-label">{t.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input"
                  placeholder="doctor@hospital.com"
                />
              </div>

              {authMode === 'register' && (
                <>
                  <div className="form-field">
                    <label className="form-label">{t.username}</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="form-input"
                      placeholder="dr_smith"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">{t.fullName}</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="form-input"
                      placeholder="Dr. John Smith"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">{t.hospital}</label>
                    <input
                      type="text"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      className="form-input"
                      placeholder="General Hospital"
                    />
                  </div>
                </>
              )}

              <div className="form-field">
                <label className="form-label">{t.password}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="auth-error">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-submit"
              >
                {loading ? t.pleaseWait : (authMode === 'login' ? t.signIn : t.createAccount)}
              </button>

              {authMode === 'login' && (
                <div className="demo-credentials">
                  <strong>{t.demoCredentials}:</strong><br />
                  Email: doctor@hospital.com<br />
                  Password: doctor123
                </div>
              )}
            </form>

            <div className="auth-switch">
              {authMode === 'login' ? (
                <p>
                  {t.noAccount}{' '}
                  <button onClick={() => { setAuthMode('register'); setError('') }}>{t.signUp}</button>
                </p>
              ) : (
                <p>
                  {t.hasAccount}{' '}
                  <button onClick={() => { setAuthMode('login'); setError('') }}>{t.signIn}</button>
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
          overflow-x: hidden;
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideLeft {
          from { opacity: 0; transform: translateX(60px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.5); }
          50% { box-shadow: 0 0 40px rgba(102, 126, 234, 0.8); }
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes typing {
          from { width: 0; }
          to { width: 100%; }
        }

        @keyframes processingDots {
          0%, 20% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }

        .animate-fade-in-delay {
          animation: fadeIn 0.8s ease-out 0.2s both;
        }

        .animate-slide-up {
          animation: slideUp 0.8s ease-out 0.3s both;
        }

        .animate-slide-up-delay {
          animation: slideUp 0.8s ease-out 0.4s both;
        }

        .animate-slide-left {
          animation: slideLeft 0.8s ease-out 0.3s both;
        }

        .pulse {
          animation: pulse 2s ease-in-out infinite;
        }

        .floating {
          animation: float 3s ease-in-out infinite;
        }

        .glow {
          animation: glow 2s ease-in-out infinite;
        }

        .hover-lift {
          transition: all 0.3s ease;
        }

        .hover-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }

        /* Animated Background */
        .animated-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          z-index: 0;
        }

        .gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
          animation: float 8s ease-in-out infinite;
        }

        .orb-1 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          top: -100px;
          left: -100px;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 500px;
          height: 500px;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          bottom: -150px;
          right: -150px;
          animation-delay: 2s;
        }

        .orb-3 {
          width: 350px;
          height: 350px;
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          top: 50%;
          left: 50%;
          animation-delay: 4s;
        }

        /* Navigation */
        .nav {
          position: sticky;
          top: 0;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid #e5e7eb;
          padding: 1rem 0;
          z-index: 100;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .logo-icon {
          font-size: 1.75rem;
          filter: none;
          -webkit-text-fill-color: initial;
        }

        .nav-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .language-selector-nav {
          padding: 0.5rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .language-selector-nav:hover {
          border-color: #667eea;
        }

        .btn-nav {
          padding: 0.5rem 1.5rem;
          border: none;
          background: transparent;
          color: #4b5563;
          font-weight: 600;
          cursor: pointer;
          border-radius: 8px;
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
          border-radius: 8px;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        /* Hero Section */
        .hero {
          position: relative;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 6rem 2rem;
          overflow: hidden;
        }

        .hero-container {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }

        .badge {
          display: inline-block;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
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
          border-radius: 12px;
          transition: all 0.3s;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .btn-hero:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
        }

        .btn-hero-secondary {
          padding: 1rem 2rem;
          border: 2px solid white;
          background: transparent;
          color: white;
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
          border-radius: 12px;
          transition: all 0.3s;
        }

        .btn-hero-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .hero-visual {
          display: flex;
          justify-content: center;
        }

        .visual-card {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
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
        }

        .dot-green { background: #10b981; }
        .dot-yellow { background: #f59e0b; }
        .dot-red { background: #ef4444; }

        .visual-title {
          color: #1f2937;
          font-weight: 600;
        }

        .visual-content {
          color: #1f2937;
        }

        .visual-input, .visual-output {
          padding: 1rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.95rem;
        }

        .visual-input {
          background: #f3f4f6;
          border: 2px solid #d1d5db;
        }

        .typing {
          overflow: hidden;
          white-space: nowrap;
        }

        .visual-output {
          background: #ecfdf5;
          border: 2px solid #a7f3d0;
        }

        .success-pulse {
          animation: pulse 2s ease-in-out infinite;
        }

        .visual-arrow {
          text-align: center;
          padding: 1rem 0;
          color: #667eea;
          font-weight: 600;
        }

        .processing-dots {
          display: inline-flex;
          gap: 0.3rem;
        }

        .processing-dots span {
          width: 6px;
          height: 6px;
          background: #667eea;
          border-radius: 50%;
          display: inline-block;
          animation: processingDots 1.4s ease-in-out infinite;
        }

        .processing-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .processing-dots span:nth-child(3) {
          animation-delay: 0.4s;
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
          border-radius: 16px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          border: 2px solid transparent;
        }

        .feature-card:hover {
          border-color: #667eea;
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
          border-radius: 16px;
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
          position: relative;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          overflow: hidden;
        }

        .cta-container {
          position: relative;
          z-index: 1;
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
          border-radius: 12px;
          transition: all 0.3s;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .btn-cta:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
        }

        .btn-cta-secondary {
          padding: 1rem 2rem;
          border: 2px solid white;
          background: transparent;
          color: white;
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
          border-radius: 12px;
          transition: all 0.3s;
        }

        .btn-cta-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
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
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease-out;
        }

        .auth-modal {
          background: white;
          border-radius: 20px;
          padding: 3rem;
          max-width: 450px;
          width: 90%;
          position: relative;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease-out;
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
          transition: color 0.2s;
        }

        .modal-close:hover {
          color: #4b5563;
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

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-weight: 600;
          color: #4b5563;
          font-size: 0.95rem;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .auth-error {
          background: #fef2f2;
          border: 2px solid #fecaca;
          color: #dc2626;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .error-icon {
          font-size: 1.1rem;
        }

        .btn-submit {
          width: 100%;
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .demo-credentials {
          background: #f0f9ff;
          border: 2px solid #bae6fd;
          padding: 1rem;
          border-radius: 10px;
          font-size: 0.85rem;
          color: #0c4a6e;
        }

        .auth-switch {
          text-align: center;
          margin-top: 1.5rem;
          color: #6b7280;
        }

        .auth-switch button {
          background: none;
          border: none;
          color: #667eea;
          font-weight: 600;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .auth-switch button:hover {
          text-decoration: underline;
          color: #5a67d8;
        }
      `}</style>
    </div>
  )
}
