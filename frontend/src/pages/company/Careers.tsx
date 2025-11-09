import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function Careers() {
  const positions = [
    {
      title: 'Senior Full Stack Engineer',
      department: 'Engineering',
      location: 'Remote / San Francisco',
      type: 'Full-time',
      description: 'Build the next generation of AI-powered radiology tools'
    },
    {
      title: 'AI/ML Research Scientist',
      department: 'Research',
      location: 'San Francisco',
      type: 'Full-time',
      description: 'Advance medical AI and natural language processing'
    },
    {
      title: 'Clinical Radiologist Advisor',
      department: 'Product',
      location: 'Remote',
      type: 'Part-time',
      description: 'Guide product development with clinical expertise'
    },
    {
      title: 'Customer Success Manager',
      department: 'Customer Success',
      location: 'Remote / New York',
      type: 'Full-time',
      description: 'Help hospitals and practices succeed with VitaScribe'
    },
    {
      title: 'Product Designer',
      department: 'Design',
      location: 'Remote / San Francisco',
      type: 'Full-time',
      description: 'Design beautiful, intuitive healthcare experiences'
    },
    {
      title: 'Healthcare Compliance Specialist',
      department: 'Legal & Compliance',
      location: 'Remote',
      type: 'Full-time',
      description: 'Ensure HIPAA compliance and security standards'
    }
  ]

  const benefits = [
    { icon: '💰', title: 'Competitive Salary', description: 'Top of market compensation with equity' },
    { icon: '🏥', title: 'Health Coverage', description: 'Premium medical, dental, and vision' },
    { icon: '🏖️', title: 'Unlimited PTO', description: 'Take time off when you need it' },
    { icon: '💻', title: 'Remote First', description: 'Work from anywhere' },
    { icon: '📚', title: 'Learning Budget', description: '$2000/year for courses and conferences' },
    { icon: '🚀', title: 'Impact', description: 'Improve healthcare for millions' }
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
            Join Our Team
          </Badge>
          <h1 className="text-4xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
            Careers at VitaScribe
          </h1>
          <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
            Help us transform radiology reporting with AI. Work with talented people on problems that matter.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="container pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Join Us?</h2>
          <p className="text-muted-foreground">Benefits and perks of working at VitaScribe</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="text-4xl mb-2">{benefit.icon}</div>
                <CardTitle>{benefit.title}</CardTitle>
                <CardDescription>{benefit.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Open Positions */}
      <section className="container pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Open Positions</h2>
          <p className="text-muted-foreground">We're looking for talented people to join our team</p>
        </div>
        <div className="space-y-4 max-w-[800px] mx-auto">
          {positions.map((position, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{position.title}</CardTitle>
                    <CardDescription className="mt-2">{position.description}</CardDescription>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Badge variant="secondary">{position.department}</Badge>
                      <Badge variant="outline">{position.location}</Badge>
                      <Badge variant="outline">{position.type}</Badge>
                    </div>
                  </div>
                  <Link to="/company/contact">
                    <Button>Apply</Button>
                  </Link>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="container pb-24">
        <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border-primary/20">
          <CardContent className="py-12">
            <div className="max-w-[800px] mx-auto space-y-6 text-center">
              <h2 className="text-3xl font-bold">Our Culture</h2>
              <p className="text-lg text-muted-foreground">
                We're a team of healthcare professionals, engineers, and designers united by a common goal:
                making radiology reporting better for everyone. We value collaboration, innovation, and making
                a real impact on patient care.
              </p>
              <p className="text-lg text-muted-foreground">
                We believe in work-life balance, remote-first culture, and creating an environment where
                everyone can do their best work.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="mx-auto max-w-[800px] text-center space-y-4">
          <h2 className="text-3xl font-bold">Don't See Your Role?</h2>
          <p className="text-muted-foreground">
            We're always looking for talented people. Send us your resume and tell us how you can contribute.
          </p>
          <Link to="/company/contact">
            <Button size="lg">Get In Touch</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container py-8 text-center text-sm text-muted-foreground">
          <p>© 2024 VitaScribe. All rights reserved. Equal opportunity employer.</p>
        </div>
      </footer>
    </div>
  )
}
