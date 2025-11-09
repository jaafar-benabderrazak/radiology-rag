import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Input Clinical Indication',
      description: 'Type or dictate the patient\'s symptoms, clinical history, and reason for examination using our intuitive interface or voice recognition.',
      features: ['Text input', 'Voice dictation', 'Multi-language support', 'Auto-save'],
      image: '📝'
    },
    {
      number: '02',
      title: 'AI Selects Template',
      description: 'Our advanced AI analyzes your input and automatically selects the most appropriate report template based on clinical context and anatomical keywords.',
      features: ['Smart matching', 'Context analysis', 'Template suggestions', 'Manual override'],
      image: '🤖'
    },
    {
      number: '03',
      title: 'Generate Report',
      description: 'The AI generates a complete, structured report in seconds, following the template structure and filling in all relevant sections.',
      features: ['Instant generation', 'Structured format', 'Medical terminology', 'Quality checks'],
      image: '✨'
    },
    {
      number: '04',
      title: 'Review & Edit',
      description: 'Review the generated report, make any necessary edits, and use AI validation to ensure accuracy and completeness.',
      features: ['Real-time editing', 'AI suggestions', 'Validation checks', 'Version history'],
      image: '👀'
    },
    {
      number: '05',
      title: 'Export & Integrate',
      description: 'Export your report in Word or PDF format, ready for your PACS or EMR system. All reports are saved in your history.',
      features: ['Multiple formats', 'Print-ready', 'EMR integration', 'Auto-archive'],
      image: '📤'
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

      {/* Hero */}
      <section className="container py-24 space-y-8">
        <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
          <Badge variant="secondary" className="mb-4">
            Simple, Fast & Accurate
          </Badge>
          <h1 className="text-4xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
            How It Works
          </h1>
          <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
            From clinical indication to complete report in just 5 simple steps. Our AI-powered workflow makes radiology reporting faster and more accurate.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="container pb-24">
        <div className="space-y-8">
          {steps.map((step, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-0">
                <div className={`grid md:grid-cols-2 gap-8 items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                  <div className={`p-8 md:p-12 ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-6xl font-bold text-primary/20">{step.number}</div>
                      <Badge variant="outline">Step {index + 1}</Badge>
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                    <p className="text-muted-foreground mb-6">{step.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {step.features.map((feature, i) => (
                        <Badge key={i} variant="secondary">
                          ✓ {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className={`bg-gradient-to-br from-primary/10 to-purple-500/10 p-12 flex items-center justify-center min-h-[300px] ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                    <div className="text-9xl">{step.image}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="container pb-24">
        <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border-primary/20">
          <CardContent className="py-12">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">90%</div>
                <div className="text-muted-foreground">Time Saved</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">&lt;30s</div>
                <div className="text-muted-foreground">Average Generation Time</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">99.5%</div>
                <div className="text-muted-foreground">Accuracy Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="mx-auto max-w-[800px] text-center space-y-4">
          <h2 className="text-3xl font-bold">Ready to Experience VitaScribe?</h2>
          <p className="text-muted-foreground">
            Start your free trial today and see how easy radiology reporting can be
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/app">
              <Button size="lg">Start Free Trial</Button>
            </Link>
            <Link to="/product/features">
              <Button size="lg" variant="outline">Explore Features</Button>
            </Link>
          </div>
        </div>
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
