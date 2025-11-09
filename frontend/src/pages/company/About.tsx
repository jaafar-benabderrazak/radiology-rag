import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function About() {
  const team = [
    { name: 'Dr. Sarah Chen', role: 'Co-Founder & CEO', avatar: '👩‍⚕️', bio: 'Radiologist with 15 years experience' },
    { name: 'Dr. Michael Rodriguez', role: 'Co-Founder & CMO', avatar: '👨‍⚕️', bio: 'Former Chief of Radiology' },
    { name: 'Dr. Aisha Patel', role: 'Head of AI Research', avatar: '👩‍💻', bio: 'PhD in Medical AI from MIT' },
    { name: 'Dr. James Kim', role: 'VP of Engineering', avatar: '👨‍💻', bio: '20+ years in health tech' }
  ]

  const values = [
    { icon: '🎯', title: 'Patient-First', description: 'Everything we build starts with improving patient care' },
    { icon: '🔬', title: 'Innovation', description: 'Pushing the boundaries of AI in healthcare' },
    { icon: '🤝', title: 'Collaboration', description: 'Working together with radiologists to build better tools' },
    { icon: '🛡️', title: 'Trust & Security', description: 'HIPAA compliance and data security are non-negotiable' }
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
            Our Story
          </Badge>
          <h1 className="text-4xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
            About VitaScribe
          </h1>
          <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
            Founded by radiologists, for radiologists. We're on a mission to transform radiology reporting through AI.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="container pb-24">
        <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border-primary/20">
          <CardContent className="py-12">
            <div className="max-w-[800px] mx-auto space-y-6">
              <h2 className="text-3xl font-bold text-center mb-8">Our Mission</h2>
              <p className="text-lg text-muted-foreground">
                VitaScribe was born from a simple observation: radiologists spend too much time on repetitive tasks and not enough time on complex cases that truly need their expertise.
              </p>
              <p className="text-lg text-muted-foreground">
                Founded in 2023 by a team of radiologists and AI researchers, we set out to build the smartest, most intuitive radiology reporting platform ever created. Today, VitaScribe helps hundreds of radiologists save 90% of their reporting time while maintaining the highest standards of accuracy and quality.
              </p>
              <p className="text-lg text-muted-foreground">
                Our vision is a future where AI handles the routine, freeing radiologists to focus on what matters most: patient care and complex diagnostic challenges.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Values */}
      <section className="container pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Values</h2>
          <p className="text-muted-foreground">The principles that guide everything we do</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="text-4xl mb-4">{value.icon}</div>
                <CardTitle>{value.title}</CardTitle>
                <CardDescription>{value.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="container pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Meet Our Leadership</h2>
          <p className="text-muted-foreground">Experts in radiology, AI, and health technology</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((member, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="text-6xl text-center mb-4">{member.avatar}</div>
                <CardTitle className="text-center text-lg">{member.name}</CardTitle>
                <CardDescription className="text-center">{member.role}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-center text-muted-foreground">{member.bio}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="container pb-24">
        <Card>
          <CardContent className="py-12">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">500+</div>
                <div className="text-sm text-muted-foreground">Radiologists</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">50+</div>
                <div className="text-sm text-muted-foreground">Hospitals</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">100K+</div>
                <div className="text-sm text-muted-foreground">Reports Generated</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">30+</div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="mx-auto max-w-[800px] text-center space-y-4">
          <h2 className="text-3xl font-bold">Join Us</h2>
          <p className="text-muted-foreground">
            We're always looking for talented individuals to join our mission
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/company/careers">
              <Button size="lg">View Open Positions</Button>
            </Link>
            <Link to="/company/contact">
              <Button size="lg" variant="outline">Contact Us</Button>
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
