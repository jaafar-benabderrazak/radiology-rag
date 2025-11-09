import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function Pricing() {
  const plans = [
    {
      name: 'Starter',
      price: '$49',
      period: '/month',
      description: 'Perfect for individual radiologists',
      features: [
        'Up to 100 reports/month',
        'All AI features',
        'Voice recognition',
        'Word & PDF export',
        'Email support',
        '7-day report history'
      ],
      popular: false,
      cta: 'Start Free Trial'
    },
    {
      name: 'Professional',
      price: '$149',
      period: '/month',
      description: 'For busy radiology practices',
      features: [
        'Up to 500 reports/month',
        'Everything in Starter',
        'Priority support',
        'Custom templates',
        '90-day report history',
        'Team collaboration',
        'API access'
      ],
      popular: true,
      cta: 'Start Free Trial'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For hospitals and large practices',
      features: [
        'Unlimited reports',
        'Everything in Professional',
        'Dedicated account manager',
        'Custom AI training',
        'Unlimited history',
        'SSO/SAML integration',
        'SLA guarantee',
        'On-premise deployment option'
      ],
      popular: false,
      cta: 'Contact Sales'
    }
  ]

  const addons = [
    {
      name: 'Advanced Analytics',
      price: '$29/month',
      description: 'Comprehensive reporting analytics and insights'
    },
    {
      name: 'PACS Integration',
      price: '$99/month',
      description: 'Direct integration with your PACS system'
    },
    {
      name: 'Custom AI Training',
      price: 'Contact us',
      description: 'Train AI models on your specific use cases'
    },
    {
      name: 'White Labeling',
      price: 'Contact us',
      description: 'Brand VitaScribe as your own solution'
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
            💎 Simple, Transparent Pricing
          </Badge>
          <h1 className="text-4xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
            Invest in Your Peace of Mind
          </h1>
          <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
            Choose the plan that best fits your needs. All plans include HIPAA compliance, security, and regular updates.
          </p>
          <p className="text-sm text-muted-foreground">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container pb-24">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2 text-primary">✓</span>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link to="/app" className="w-full">
                  <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                    {plan.cta}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Add-ons */}
      <section className="container pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Optional Add-ons</h2>
          <p className="text-muted-foreground">Enhance your VitaScribe experience with these add-ons</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-[900px] mx-auto">
          {addons.map((addon, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{addon.name}</CardTitle>
                  <Badge variant="outline">{addon.price}</Badge>
                </div>
                <CardDescription>{addon.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container pb-24">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
              <p className="text-sm text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What happens if I exceed my report limit?</h3>
              <p className="text-sm text-muted-foreground">You'll be notified when you reach 80% of your limit. Additional reports are charged at $0.50 per report.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a long-term contract?</h3>
              <p className="text-sm text-muted-foreground">No, all plans are month-to-month. Annual plans get 20% discount with no long-term commitment.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Do you offer academic or non-profit pricing?</h3>
              <p className="text-sm text-muted-foreground">Yes! We offer special pricing for academic institutions and non-profits. Contact us for details.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border-primary/20">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <h2 className="text-3xl font-bold">Still have questions?</h2>
            <p className="max-w-[600px] text-muted-foreground">
              Our team is here to help. Contact us for a personalized demo and pricing consultation.
            </p>
            <Link to="/company/contact">
              <Button size="lg">Contact Sales</Button>
            </Link>
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
