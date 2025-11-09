import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'

interface WorkflowStep {
  number: number
  title: string
  description: string
  icon: string
  details: string[]
  color: string
  gradient: string
}

interface AnimatedWorkflowProps {
  language: 'en' | 'fr'
}

export default function AnimatedWorkflow({ language }: AnimatedWorkflowProps) {
  const [activeStep, setActiveStep] = useState(0)
  const [isInView, setIsInView] = useState(false)

  const content = {
    en: {
      title: 'How VitaScribe Works',
      subtitle: 'From clinical indication to comprehensive report in seconds',
      tryIt: 'Try It Now',
      steps: [
        {
          number: 1,
          title: 'Input Clinical Data',
          description: 'Type or dictate patient information',
          icon: '🎤',
          details: [
            'Voice or text input',
            'Multi-language support',
            'Real-time transcription',
            'Patient metadata'
          ],
          color: 'blue',
          gradient: 'from-blue-500 to-cyan-500'
        },
        {
          number: 2,
          title: 'AI Analysis',
          description: 'Advanced AI processes and analyzes',
          icon: '🤖',
          details: [
            'Template matching',
            'Context analysis',
            'Anatomical recognition',
            'Medical terminology'
          ],
          color: 'purple',
          gradient: 'from-purple-500 to-pink-500'
        },
        {
          number: 3,
          title: 'Report Generation',
          description: 'Structured medical report created',
          icon: '📄',
          details: [
            'Professional formatting',
            'Key findings highlighted',
            'Quality validation',
            'Comprehensive structure'
          ],
          color: 'green',
          gradient: 'from-green-500 to-emerald-500'
        },
        {
          number: 4,
          title: 'Review & Export',
          description: 'Final review and distribution',
          icon: '✅',
          details: [
            'Edit if needed',
            'AI validation check',
            'Export to Word/PDF',
            'PACS integration'
          ],
          color: 'orange',
          gradient: 'from-orange-500 to-red-500'
        }
      ] as WorkflowStep[]
    },
    fr: {
      title: 'Comment Fonctionne VitaScribe',
      subtitle: 'De l\'indication clinique au rapport complet en quelques secondes',
      tryIt: 'Essayez Maintenant',
      steps: [
        {
          number: 1,
          title: 'Saisie des Données Cliniques',
          description: 'Tapez ou dictez les informations du patient',
          icon: '🎤',
          details: [
            'Saisie vocale ou textuelle',
            'Support multilingue',
            'Transcription en temps réel',
            'Métadonnées patient'
          ],
          color: 'blue',
          gradient: 'from-blue-500 to-cyan-500'
        },
        {
          number: 2,
          title: 'Analyse IA',
          description: 'IA avancée traite et analyse',
          icon: '🤖',
          details: [
            'Correspondance de modèle',
            'Analyse de contexte',
            'Reconnaissance anatomique',
            'Terminologie médicale'
          ],
          color: 'purple',
          gradient: 'from-purple-500 to-pink-500'
        },
        {
          number: 3,
          title: 'Génération du Rapport',
          description: 'Rapport médical structuré créé',
          icon: '📄',
          details: [
            'Formatage professionnel',
            'Résultats clés surlignés',
            'Validation qualité',
            'Structure complète'
          ],
          color: 'green',
          gradient: 'from-green-500 to-emerald-500'
        },
        {
          number: 4,
          title: 'Révision & Export',
          description: 'Révision finale et distribution',
          icon: '✅',
          details: [
            'Modifier si nécessaire',
            'Vérification IA',
            'Export Word/PDF',
            'Intégration PACS'
          ],
          color: 'orange',
          gradient: 'from-orange-500 to-red-500'
        }
      ] as WorkflowStep[]
    }
  }

  const t = content[language]

  useEffect(() => {
    setIsInView(true)
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % t.steps.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [t.steps.length])

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-muted/30 to-background py-24">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <div className="container px-4 mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 text-sm px-4 py-1">
            ⚡ Lightning Fast Workflow
          </Badge>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
            {t.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        {/* Workflow Visualization */}
        <div className="relative">
          {/* Connection Lines */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 via-green-500 to-orange-500 opacity-20" />
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-purple-500 via-green-500 to-orange-500 transition-all duration-1000"
              style={{ width: `${((activeStep + 1) / t.steps.length) * 100}%` }}
            />
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 relative">
            {t.steps.map((step, index) => (
              <div
                key={index}
                className={`transform transition-all duration-500 ${
                  isInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onMouseEnter={() => setActiveStep(index)}
              >
                <Card
                  className={`relative group cursor-pointer transition-all duration-300 hover:shadow-2xl ${
                    activeStep === index
                      ? 'scale-105 shadow-xl border-2 border-primary'
                      : 'hover:scale-102'
                  }`}
                >
                  {/* Step Number Badge */}
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg bg-gradient-to-br ${step.gradient}`}>
                    <span className={activeStep === index ? 'animate-pulse' : ''}>
                      {step.number}
                    </span>
                  </div>

                  {/* Gradient overlay on active */}
                  <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${step.gradient} opacity-0 transition-opacity duration-300 ${
                    activeStep === index ? 'opacity-5' : 'group-hover:opacity-5'
                  }`} />

                  <CardContent className="pt-12 pb-6 px-6 relative">
                    {/* Icon */}
                    <div className={`text-6xl mb-4 text-center transform transition-transform duration-300 ${
                      activeStep === index ? 'scale-110 rotate-6' : 'group-hover:scale-110'
                    }`}>
                      {step.icon}
                    </div>

                    {/* Title */}
                    <h3 className={`text-xl font-bold mb-2 text-center transition-colors ${
                      activeStep === index ? 'text-primary' : ''
                    }`}>
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      {step.description}
                    </p>

                    {/* Details List */}
                    <ul className="space-y-2">
                      {step.details.map((detail, i) => (
                        <li
                          key={i}
                          className={`flex items-start text-xs transition-all duration-300 ${
                            activeStep === index ? 'translate-x-1' : ''
                          }`}
                          style={{ transitionDelay: `${i * 50}ms` }}
                        >
                          <span className="mr-2 text-primary flex-shrink-0">✓</span>
                          <span className="text-muted-foreground">{detail}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Progress indicator */}
                    {activeStep === index && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                    )}
                  </CardContent>
                </Card>

                {/* Arrow connector for desktop */}
                {index < t.steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-20">
                    <div className={`text-2xl transition-all duration-300 ${
                      activeStep === index ? 'scale-125 text-primary' : 'text-muted-foreground/30'
                    }`}>
                      →
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mt-12">
          {t.steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveStep(index)}
              className={`transition-all duration-300 rounded-full ${
                activeStep === index
                  ? 'w-8 h-3 bg-primary'
                  : 'w-3 h-3 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-gradient-to-r from-primary via-purple-600 to-pink-600 rounded-full text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <span>{t.tryIt}</span>
            <span className="animate-bounce">→</span>
          </div>
        </div>
      </div>
    </section>
  )
}
