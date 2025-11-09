import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function Privacy() {
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

      {/* Content */}
      <div className="container py-12 max-w-[900px]">
        <div className="mb-8">
          <Badge variant="secondary" className="mb-4">Last updated: January 2024</Badge>
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Your privacy is important to us. This Privacy Policy explains how VitaScribe collects, uses, and protects your information.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Account Information</h4>
                <p>When you create an account, we collect your name, email address, hospital/institution name, and professional credentials.</p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Medical Reports</h4>
                <p>We process clinical indications and generated reports. All patient health information (PHI) is encrypted and stored in compliance with HIPAA regulations.</p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Usage Data</h4>
                <p>We collect information about how you use our services, including features accessed, report generation statistics, and system performance data.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Provide and improve our services</p>
              <p>• Generate radiology reports using AI</p>
              <p>• Send important updates and notifications</p>
              <p>• Ensure security and prevent fraud</p>
              <p>• Comply with legal obligations</p>
              <p>• Analyze usage patterns to improve our AI models</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Data Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>We implement industry-leading security measures to protect your data:</p>
              <ul className="space-y-2 ml-4">
                <li>• End-to-end encryption for all PHI</li>
                <li>• SOC 2 Type II certified infrastructure</li>
                <li>• Regular security audits and penetration testing</li>
                <li>• Role-based access controls</li>
                <li>• Comprehensive audit logging</li>
                <li>• HIPAA-compliant data centers</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Data Sharing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>We do not sell your personal information. We may share data with:</p>
              <ul className="space-y-2 ml-4">
                <li>• <strong>Service Providers:</strong> Third-party vendors who help us operate our services (all under strict data processing agreements)</li>
                <li>• <strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li>• <strong>Business Transfers:</strong> In the event of a merger or acquisition (with your prior consent)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>You have the right to:</p>
              <p>• Access your personal data</p>
              <p>• Correct inaccurate data</p>
              <p>• Request deletion of your data</p>
              <p>• Export your data</p>
              <p>• Opt-out of marketing communications</p>
              <p>• File a complaint with regulatory authorities</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>We retain your data for as long as your account is active or as needed to provide services. Medical reports are retained for 7 years in compliance with healthcare regulations, unless you request earlier deletion.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. International Transfers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Your data is primarily stored in the United States. If you access our services from outside the US, your data may be transferred internationally. We ensure appropriate safeguards are in place for all international transfers.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Cookies and Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>We use cookies and similar technologies to improve your experience. You can control cookie settings through your browser preferences.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Our services are not intended for individuals under 18. We do not knowingly collect information from children.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Changes to This Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>We may update this policy periodically. We will notify you of significant changes via email or through our platform.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>For privacy-related questions or concerns:</p>
              <p className="font-semibold text-foreground mt-4">Email: privacy@vitascribe.com</p>
              <p className="font-semibold text-foreground">Address: VitaScribe, 123 Medical Plaza, Suite 500, San Francisco, CA 94105</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 flex gap-4 justify-center">
          <Link to="/legal/terms">
            <Button variant="outline">Terms of Service</Button>
          </Link>
          <Link to="/legal/hipaa">
            <Button variant="outline">HIPAA Compliance</Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-24">
        <div className="container py-8 text-center text-sm text-muted-foreground">
          <p>© 2024 VitaScribe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
