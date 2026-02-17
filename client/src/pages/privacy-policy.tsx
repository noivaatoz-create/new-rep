import { Link } from "wouter";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-primary text-sm font-bold tracking-widest uppercase mb-4">Legal</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6" data-testid="text-page-title">Privacy Policy</h1>
          <p className="text-muted-foreground text-lg">Your privacy is important to us. This policy explains how Novaatoz collects, uses, and protects your personal information.</p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-section-information-collection">Information Collection</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
              <p>When you visit our website, create an account, or place an order, we may collect the following types of personal information:</p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>Full name and contact details</li>
                <li>Email address</li>
                <li>Shipping and billing address</li>
                <li>Payment information (credit card numbers, billing details)</li>
                <li>Phone number</li>
                <li>Account login credentials</li>
                <li>Device and browser information collected automatically when you browse our site</li>
              </ul>
              <p>We collect this information directly from you when you provide it to us, as well as automatically through cookies and similar technologies when you interact with our website.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-section-how-information-used">How Information is Used</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
              <p>Novaatoz uses the information we collect for the following purposes:</p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>Processing and fulfilling your orders, including shipping and payment processing</li>
                <li>Communicating with you about your orders, account, and customer service inquiries</li>
                <li>Sending promotional emails and updates about new products (with your consent)</li>
                <li>Improving our website, products, and overall customer experience</li>
                <li>Analyzing site usage and trends to enhance functionality and performance</li>
                <li>Preventing fraud and ensuring the security of our platform</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-section-information-sharing">Information Sharing</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
              <p>Novaatoz does not sell, trade, or rent your personal information to third parties. We may share your information only in the following limited circumstances:</p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>With shipping carriers and logistics partners to deliver your orders</li>
                <li>With payment processors to securely handle your transactions</li>
                <li>With service providers who assist us in operating our website and conducting business, provided they agree to keep your information confidential</li>
                <li>When required by law, regulation, or legal process</li>
              </ul>
              <p>All third-party service providers are contractually obligated to protect your data and use it only for the specific services they provide to Novaatoz.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-section-cookies">Cookies</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
              <p>Novaatoz uses cookies and similar tracking technologies to enhance your browsing experience. Cookies are small data files stored on your device that help us:</p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>Remember items in your shopping cart between visits</li>
                <li>Maintain your session while you browse our site</li>
                <li>Understand how you interact with our website to improve usability</li>
                <li>Remember your preferences and settings</li>
              </ul>
              <p>You can control cookie settings through your browser preferences. Please note that disabling cookies may affect certain features of our website, such as the ability to add items to your cart or complete a purchase.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-section-data-security">Data Security</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
              <p>Novaatoz takes the security of your personal information seriously. We implement a variety of measures to protect your data, including:</p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>SSL/TLS encryption for all data transmitted between your browser and our servers</li>
                <li>Secure, encrypted storage of sensitive information such as payment details</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Restricted access to personal information on a need-to-know basis among our staff</li>
                <li>Industry-standard firewalls and intrusion detection systems</li>
              </ul>
              <p>While we strive to protect your personal information, no method of transmission over the internet or electronic storage is completely secure. We cannot guarantee absolute security but are committed to maintaining the highest standards of data protection.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-section-your-rights">Your Rights</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
              <p>You have the following rights regarding your personal information:</p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>Access: You may request a copy of the personal data we hold about you at any time</li>
                <li>Correction: You may request that we update or correct any inaccurate information</li>
                <li>Deletion: You may request that we delete your personal data, subject to legal obligations</li>
                <li>Opt-out: You may unsubscribe from marketing communications at any time by clicking the unsubscribe link in any email or contacting us directly</li>
                <li>Data portability: You may request your data in a structured, commonly used format</li>
              </ul>
              <p>To exercise any of these rights, please contact us using the information provided below. We will respond to your request within 30 days.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-section-contact">Contact Us</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
              <p>If you have any questions or concerns about this Privacy Policy or how we handle your personal information, please contact us:</p>
              <ul className="list-none space-y-2 pl-2">
                <li>Email: privacy@novaatoz.com</li>
                <li>Phone: +1 (800) 555-0199</li>
                <li>Address: 123 Innovation Drive, San Francisco, CA 94105, United States</li>
              </ul>
              <p>You may also visit our <Link href="/contact" className="text-primary hover:underline" data-testid="link-contact">Contact Us</Link> page to submit a message directly.</p>
            </div>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-border text-center">
          <p className="text-muted-foreground text-sm" data-testid="text-last-updated">
            Last updated: February 2026
          </p>
        </div>
      </div>
    </div>
  );
}
