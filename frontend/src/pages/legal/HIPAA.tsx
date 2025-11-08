import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function HIPAA() {
  const compliance = [
    { icon: '🔒', title: 'Encryption', description: 'End-to-end encryption for all PHI in transit and at rest' },
    { icon: '👥', title: 'Access Controls', description: 'Role-based access with multi-factor authentication' },
    { icon: '📋', title: 'Audit Logs', description: 'Comprehensive logging of all PHI access and modifications' },
    { icon: '🛡️', title: 'Security Safeguards', description: 'Administrative, physical, and technical safeguards' },
    { icon: '📄', title: 'BAA Available', description: 'Business Associate Agreement for all healthcare customers' },
    { icon: '🔍', title: 'Regular Audits', description: 'Annual HIPAA compliance audits by third parties' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
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

      <div className="container py-12 max-w-[900px]">
        <div className="mb-8">
          <Badge variant="secondary" className="mb-4">HIPAA Compliant</Badge>
          <h1 className="text-4xl font-bold mb-4">HIPAA Compliance</h1>
          <p className="text-muted-foreground">
            VitaScribe is designed with HIPAA compliance at its core. Learn how we protect your patients' health information.
          </p>
        </div>

        {/* Compliance Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Our Commitment to HIPAA Compliance</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {compliance.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="text-4xl mb-2">{item.icon}</div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>What is HIPAA?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>The Health Insurance Portability and Accountability Act (HIPAA) is a federal law that requires the creation of national standards to protect sensitive patient health information from being disclosed without patient consent or knowledge.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How VitaScribe Ensures HIPAA Compliance</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <h4 className="font-semibold text-foreground">Administrative Safeguards</h4>
              <ul className="ml-4 space-y-1">
                <li>• Comprehensive security policies and procedures</li>
                <li>• Regular risk assessments and management</li>
                <li>• Workforce security training</li>
                <li>• Contingency planning and disaster recovery</li>
                <li>• Business Associate Agreements with all vendors</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">Physical Safeguards</h4>
              <ul className="ml-4 space-y-1">
                <li>• SOC 2 Type II certified data centers</li>
                <li>• 24/7 physical security and monitoring</li>
                <li>• Controlled facility access</li>
                <li>• Workstation and device security</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">Technical Safeguards</h4>
              <ul className="ml-4 space-y-1">
                <li>• Unique user identification and authentication</li>
                <li>• AES-256 encryption for data at rest</li>
                <li>• TLS 1.3 encryption for data in transit</li>
                <li>• Automatic access timeout and session management</li>
                <li>• Comprehensive audit controls and logging</li>
                <li>• Regular vulnerability scanning and penetration testing</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Associate Agreement (BAA)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>As a Business Associate, VitaScribe signs a BAA with all healthcare customers. This legally binding agreement ensures that:</p>
              <ul className="ml-4 space-y-1">
                <li>• We will appropriately safeguard PHI</li>
                <li>• We will report any breaches in accordance with HIPAA</li>
                <li>• We will make our internal practices available for review</li>
                <li>• We will return or destroy PHI upon contract termination</li>
              </ul>
              <p className="mt-4">A BAA is automatically provided to all Enterprise customers and available upon request for Professional plan customers.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Encryption</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>All Protected Health Information (PHI) is encrypted using industry-standard encryption:</p>
              <ul className="ml-4 space-y-1">
                <li>• <strong>At Rest:</strong> AES-256 encryption</li>
                <li>• <strong>In Transit:</strong> TLS 1.3</li>
                <li>• <strong>Backup:</strong> Encrypted backups with separate encryption keys</li>
                <li>• <strong>Database:</strong> Encrypted at the column level for sensitive fields</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Access Controls & Authentication</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>We implement strict access controls to ensure only authorized personnel can access PHI:</p>
              <ul className="ml-4 space-y-1">
                <li>• Multi-factor authentication (MFA) required for all accounts</li>
                <li>• Role-based access control (RBAC)</li>
                <li>• Automatic session timeout after inactivity</li>
                <li>• Password complexity requirements</li>
                <li>• Single Sign-On (SSO) support for Enterprise customers</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audit Logging & Monitoring</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>Every action involving PHI is logged and monitored:</p>
              <ul className="ml-4 space-y-1">
                <li>• Comprehensive audit trails of all PHI access</li>
                <li>• Real-time monitoring for suspicious activities</li>
                <li>• Audit logs retained for 7 years</li>
                <li>• Automated alerts for security events</li>
                <li>• Audit log access available to customers upon request</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Breach Notification</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>In the unlikely event of a breach, we will:</p>
              <ul className="ml-4 space-y-1">
                <li>• Notify affected customers within 24 hours of discovery</li>
                <li>• Provide detailed information about the breach</li>
                <li>• Work with you to notify affected individuals as required</li>
                <li>• Report to HHS as required by HIPAA</li>
                <li>• Implement corrective actions to prevent future breaches</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employee Training</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>All VitaScribe employees undergo:</p>
              <ul className="ml-4 space-y-1">
                <li>• HIPAA compliance training during onboarding</li>
                <li>• Annual refresher training</li>
                <li>• Regular security awareness training</li>
                <li>• Background checks for employees with PHI access</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Third-Party Vendors</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>We carefully vet all third-party vendors who may have access to PHI:</p>
              <ul className="ml-4 space-y-1">
                <li>• All vendors sign Business Associate Agreements</li>
                <li>• Regular vendor security audits</li>
                <li>• Minimum necessary access principle</li>
                <li>• AWS (SOC 2, HIPAA compliant infrastructure)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Certifications & Audits</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>VitaScribe maintains the following certifications:</p>
              <ul className="ml-4 space-y-1">
                <li>• SOC 2 Type II Certified</li>
                <li>• Annual HIPAA compliance audits</li>
                <li>• Regular penetration testing</li>
                <li>• Vulnerability assessments</li>
              </ul>
              <p className="mt-4">Certification reports available to Enterprise customers upon request.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>While we provide a HIPAA-compliant platform, covered entities are also responsible for:</p>
              <ul className="ml-4 space-y-1">
                <li>• Training your staff on HIPAA compliance</li>
                <li>• Using strong passwords and enabling MFA</li>
                <li>• Not sharing account credentials</li>
                <li>• Reviewing and approving all AI-generated reports</li>
                <li>• Reporting any suspected security incidents</li>
                <li>• Maintaining your own HIPAA compliance program</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Questions About HIPAA Compliance?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Our security team is here to help. Contact us for:</p>
              <ul className="ml-4 space-y-1">
                <li>• BAA requests</li>
                <li>• Security questionnaires</li>
                <li>• Compliance documentation</li>
                <li>• Audit reports</li>
              </ul>
              <p className="font-semibold text-foreground mt-4">Email: security@vitascribe.com</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 flex gap-4 justify-center">
          <Link to="/legal/privacy">
            <Button variant="outline">Privacy Policy</Button>
          </Link>
          <Link to="/legal/terms">
            <Button variant="outline">Terms of Service</Button>
          </Link>
        </div>
      </div>

      <footer className="border-t bg-muted/50 mt-24">
        <div className="container py-8 text-center text-sm text-muted-foreground">
          <p>© 2024 VitaScribe. All rights reserved. | HIPAA Compliant | SOC 2 Type II Certified</p>
        </div>
      </footer>
    </div>
  )
}
