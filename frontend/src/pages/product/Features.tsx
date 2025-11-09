import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useState } from 'react'

export default function Features() {
  const [activeCategory, setActiveCategory] = useState('all')

  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Generation',
      category: 'Core Technology',
      gradient: 'from-purple-500 to-pink-500',
      description: 'Advanced AI automatically generates comprehensive reports from clinical indications',
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
      gradient: 'from-blue-500 to-cyan-500',
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
      gradient: 'from-green-500 to-emerald-500',
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
      gradient: 'from-orange-500 to-red-500',
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
      gradient: 'from-indigo-500 to-purple-500',
      description: 'AI automatically selects the best template based on clinical indication and context',
      benefits: [
        'Context-aware selection',
        'Intelligent pattern recognition',
        'Anatomical understanding',
        'Continuous improvement'
      ]
    },
    {
      icon: '📄',
      title: 'Export Options',
      category: 'Integration',
      gradient: 'from-teal-500 to-cyan-500',
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
      gradient: 'from-lime-500 to-green-500',
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
      gradient: 'from-red-500 to-pink-500',
      description: 'HIPAA-ready with encrypted data storage and role-based access control',
      benefits: [
        'End-to-end encryption',
        'HIPAA compliance',
        'Audit logging',
        'Role-based access'
      ]
    },
    {
      icon: '📊',
      title: 'Report History',
      category: 'Data Management',
      gradient: 'from-violet-500 to-fuchsia-500',
      description: 'Track and manage all generated reports with powerful search and filtering',
      benefits: [
        'Searchable history',
        'Advanced filters',
        'Export capabilities',
        'Analytics dashboard'
      ]
    },
    {
      icon: '⚙️',
      title: 'Admin Controls',
      category: 'Management',
      gradient: 'from-gray-500 to-slate-600',
      description: 'Comprehensive admin panel for managing users, templates, and system settings',
      benefits: [
        'User management',
        'Template administration',
        'System configuration',
        'Usage analytics'
      ]
    },
    {
      icon: '⚡',
      title: 'High Performance',
      category: 'Core Technology',
      gradient: 'from-yellow-500 to-orange-500',
      description: 'Lightning-fast report generation with optimized AI processing',
      benefits: [
        'Sub-second response times',
        'Efficient resource usage',
        'Scalable architecture',
        'CDN delivery'
      ]
    },
    {
      icon: '🔄',
      title: 'Regular Updates',
      category: 'Core Technology',
      gradient: 'from-sky-500 to-blue-500',
      description: 'Continuous improvements with regular feature updates and model enhancements',
      benefits: [
        'Monthly feature releases',
        'AI model improvements',
        'Bug fixes',
        'Security patches'
      ]
    }
  ]

  const categories = ['all', ...Array.from(new Set(features.map(f => f.category)))]

  const filteredFeatures = activeCategory === 'all'
    ? features
    : features.filter(f => f.category === activeCategory)

  const stats = [
    { value: '90%', label: 'Time Saved', icon: '⏱️' },
    { value: '100+', label: 'Templates', icon: '📚' },
    { value: '10k+', label: 'Reports Generated', icon: '📄' },
    { value: '500+', label: 'Active Users', icon: '👥' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🏥</span>
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              VitaScribe
            </span>
          </Link>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-6">
              <Link to="/product/pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link to="/company/about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                About
              </Link>
            </nav>
            <Button asChild>
              <Link to="/">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center space-y-4">
          <Badge variant="secondary" className="mb-4">
            ✨ AI-Powered Radiology Platform
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Powerful Features for
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {' '}Modern Radiology
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
            Everything you need to streamline your radiology workflow with AI-powered intelligence and enterprise-grade security
          </p>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center transform transition-all hover:scale-105 hover:shadow-lg border-2">
              <CardContent className="pt-6">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="my-8" />

      {/* Features Section */}
      <section className="container px-4 py-16">
        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(category)}
              className="transition-all"
            >
              {category === 'all' ? 'All Features' : category}
            </Button>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredFeatures.map((feature, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 hover:border-primary"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`text-4xl mb-2 transform transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                    {feature.icon}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {feature.category}
                  </Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
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
      <section className="container px-4 py-16">
        <Card className="bg-gradient-to-r from-primary to-purple-600 text-white border-0">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-lg mb-8 text-white/90 max-w-2xl">
              Join hundreds of radiologists using VitaScribe to generate accurate reports in seconds
            </p>
            <div className="flex gap-4">
              <Button asChild size="lg" variant="secondary">
                <Link to="/">Start Free Trial</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30">
                <Link to="/company/contact">Contact Sales</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 VitaScribe. All rights reserved.
          </p>
          <nav className="flex gap-6">
            <Link to="/legal/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link to="/legal/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Terms
            </Link>
            <Link to="/legal/hipaa" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              HIPAA
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
