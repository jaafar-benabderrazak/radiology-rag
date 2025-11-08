import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function Features() {
  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Generation',
      category: 'Core Technology',
      description: 'Advanced Gemini 2.0 AI automatically generates comprehensive reports from clinical indications',
      benefits: [
        'Natural language understanding',
        'Context-aware generation',
        'Medical terminology accuracy',
        'Structured output formatting'
      ]
    },
    {
      icon: '🎤',
      title: 'Voice Recognition',
      category: 'Input Methods',
      description: 'Dictate clinical findings naturally with real-time transcription in multiple languages',
      benefits: [
        'Hands-free operation',
        'Real-time transcription',
        'Multi-language support',
        'High accuracy recognition'
      ]
    },
    {
      icon: '🌍',
      title: 'Multi-Language Support',
      category: 'Localization',
      description: 'Generate reports in French, English, or Arabic with automatic language detection',
      benefits: [
        'Automatic language detection',
        'Professional translations',
        'Cultural adaptations',
        'Unicode support'
      ]
    },
    {
      icon: '📚',
      title: 'Template Library',
      category: 'Content Management',
      description: 'Extensive library of specialty-specific templates for CT, MRI, X-Ray, and more',
      benefits: [
        '100+ professional templates',
        'Specialty-specific formats',
        'Customizable structures',
        'Regular updates'
      ]
    },
    {
      icon: '🔍',
      title: 'Smart Template Matching',
      category: 'AI Intelligence',
      description: 'AI automatically selects the best template using RAG and similar case analysis',
      benefits: [
        'Context-aware selection',
        'Case similarity analysis',
        'Learning from patterns',
        'Continuous improvement'
      ]
    },
    {
      icon: '📄',
      title: 'Export Options',
      category: 'Integration',
      description: 'Download reports in Word or PDF format with highlighting and formatting',
      benefits: [
        'Multiple format support',
        'Professional formatting',
        'Syntax highlighting',
        'Print-ready output'
      ]
    },
    {
      icon: '✅',
      title: 'AI Validation',
      category: 'Quality Assurance',
      description: 'Automatic quality checks and validation to ensure report accuracy',
      benefits: [
        'Consistency checking',
        'Completeness validation',
        'Error detection',
        'Quality scoring'
      ]
    },
    {
      icon: '🔐',
      title: 'Secure & Compliant',
      category: 'Security',
      description: 'HIPAA-ready with encrypted data storage and role-based access control',
      benefits: [
        'End-to-end encryption',
        'HIPAA compliance',
        'Audit logging',
        'Role-based permissions'
      ]
    },
    {
      icon: '📊',
      title: 'Report History',
      category: 'Management',
      description: 'Complete history of generated reports with search and filtering',
      benefits: [
        'Searchable history',
        'Advanced filtering',
        'Quick retrieval',
        'Export capabilities'
      ]
    },
    {
      icon: '⚙️',
      title: 'Admin Controls',
      category: 'Administration',
      description: 'Comprehensive admin panel for managing templates, users, and settings',
      benefits: [
        'Template management',
        'User administration',
        'System configuration',
        'Analytics dashboard'
      ]
    },
    {
      icon: '🚀',
      title: 'Fast Performance',
      category: 'Performance',
      description: 'Optimized for speed with caching and efficient processing',
      benefits: [
        'Sub-second generation',
        'Smart caching',
        'Optimized queries',
        'Scalable infrastructure'
      ]
    },
    {
      icon: '🔄',
      title: 'Continuous Updates',
      category: 'Support',
      description: 'Regular feature updates and improvements based on user feedback',
      benefits: [
        'Frequent updates',
        'Bug fixes',
        'New features',
        'Performance improvements'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🏥</span>
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              VitaScribe
            </span>
          </Link>
          <Link to="/app">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 space-y-8">
        <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
          <Badge variant="secondary" className="mb-4">
            ✨ Powered by Gemini 2.0 AI
          </Badge>
          <h1 className="text-4xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
            Powerful Features for Modern Radiology
          </h1>
          <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
            Everything you need to streamline your radiology workflow. From AI-powered generation to comprehensive security.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container pb-24">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="text-4xl mb-2">{feature.icon}</div>
                  <Badge variant="outline">{feature.category}</Badge>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start text-sm">
                      <span className="mr-2 text-primary">✓</span>
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container pb-24">
        <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border-primary/20">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
            <p className="max-w-[600px] text-muted-foreground">
              Join hundreds of radiologists using VitaScribe to improve efficiency and patient care
            </p>
            <div className="flex gap-4">
              <Link to="/app">
                <Button size="lg">Start Free Trial</Button>
              </Link>
              <Link to="/product/pricing">
                <Button size="lg" variant="outline">View Pricing</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container py-8 text-center text-sm text-muted-foreground">
          <p>© 2024 VitaScribe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
