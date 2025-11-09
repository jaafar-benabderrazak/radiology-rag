import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function Terms() {
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
          <Badge variant="secondary" className="mb-4">Last updated: January 2024</Badge>
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">
            Please read these terms carefully before using VitaScribe.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>By accessing or using VitaScribe, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this service.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Use License</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>Subject to your compliance with these Terms, VitaScribe grants you a limited, non-exclusive, non-transferable license to access and use our services for your professional medical practice.</p>
              <p><strong>You may not:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• Modify or copy the materials</li>
                <li>• Use the materials for commercial purposes outside your practice</li>
                <li>• Attempt to reverse engineer any software</li>
                <li>• Remove any copyright or proprietary notations</li>
                <li>• Transfer the materials to another person or entity</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Account Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• You must provide accurate information when creating your account</p>
              <p>• You are responsible for maintaining account security</p>
              <p>• You must be a licensed healthcare professional to use our services</p>
              <p>• You must notify us immediately of any unauthorized access</p>
              <p>• You are responsible for all activities under your account</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Professional Use</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>VitaScribe is a tool to assist healthcare professionals. You agree that:</p>
              <ul className="ml-4 space-y-1">
                <li>• All generated reports must be reviewed by a qualified radiologist</li>
                <li>• Final clinical decisions remain your responsibility</li>
                <li>• VitaScribe does not replace professional medical judgment</li>
                <li>• You will use the service in compliance with applicable medical regulations</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Payment Terms</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>• Subscription fees are billed in advance on a monthly or annual basis</p>
              <p>• All fees are non-refundable except as required by law</p>
              <p>• We reserve the right to change prices with 30 days notice</p>
              <p>• Failed payments may result in service suspension</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>VitaScribe and its original content, features, and functionality are owned by VitaScribe Inc. and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>
              <p>Patient data and medical reports you create remain your property.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Disclaimer of Warranties</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>VitaScribe is provided "as is" and "as available" without warranties of any kind. We do not guarantee that:</p>
              <ul className="ml-4 space-y-1">
                <li>• The service will be uninterrupted or error-free</li>
                <li>• Results will be completely accurate</li>
                <li>• All defects will be corrected</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>To the maximum extent permitted by law, VitaScribe shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Termination</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>We may terminate or suspend your account immediately if you breach these Terms. Upon termination, your right to use the service will cease immediately. You may cancel your subscription at any time.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Governing Law</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>These Terms shall be governed by the laws of the State of California, United States, without regard to its conflict of law provisions.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>We reserve the right to modify these terms at any time. We will notify users of any material changes. Continued use of the service after changes constitutes acceptance of the new terms.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>12. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground">Email: legal@vitascribe.com</p>
              <p className="font-semibold text-foreground">Address: VitaScribe, 123 Medical Plaza, Suite 500, San Francisco, CA 94105</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 flex gap-4 justify-center">
          <Link to="/legal/privacy">
            <Button variant="outline">Privacy Policy</Button>
          </Link>
          <Link to="/legal/hipaa">
            <Button variant="outline">HIPAA Compliance</Button>
          </Link>
        </div>
      </div>

      <footer className="border-t bg-muted/50 mt-24">
        <div className="container py-8 text-center text-sm text-muted-foreground">
          <p>© 2024 VitaScribe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
