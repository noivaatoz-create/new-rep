import { Link } from "wouter";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-primary text-sm font-bold tracking-widest uppercase mb-4">Legal</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6" data-testid="text-page-title">Terms of Service</h1>
          <p className="text-muted-foreground text-lg">Please read these terms carefully before using the Novaatoz website or purchasing our products.</p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-section-acceptance">Acceptance of Terms</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
              <p>By accessing or using the Novaatoz website (novaatoz.com) and purchasing our products, you agree to be bound by these Terms of Service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>
              <p>If you do not agree with any of these terms, you are prohibited from using or accessing this site. The materials contained on this website are protected by applicable copyright and trademark law.</p>
              <p>Novaatoz reserves the right to modify these terms at any time. Changes will be effective immediately upon posting to this page. Your continued use of the website following the posting of changes constitutes your acceptance of those changes.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-section-products-pricing">Products and Pricing</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
              <p>All product descriptions, images, and specifications on the Novaatoz website are provided for informational purposes and are subject to change without notice.</p>
              <p>Prices for our products are subject to change without prior notice. While we make every effort to display accurate pricing, errors may occur. In the event of a pricing error, Novaatoz reserves the right to cancel any orders placed at the incorrect price and will notify you promptly.</p>
              <p>Product availability is not guaranteed. We reserve the right to limit the quantity of any product offered and to discontinue any product at any time. All product images are for illustration purposes and may differ slightly from the actual product.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-section-orders-payment">Orders and Payment</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
              <p>By placing an order through our website, you are making an offer to purchase the selected products. All orders are subject to acceptance by Novaatoz. We reserve the right to refuse or cancel any order for any reason, including but not limited to:</p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>Product or service availability issues</li>
                <li>Errors in product or pricing information</li>
                <li>Suspected fraudulent or unauthorized transactions</li>
                <li>Orders that appear to be placed by dealers, resellers, or distributors</li>
              </ul>
              <p>Payment must be received in full before your order is processed. We accept major credit cards, debit cards, and other payment methods as displayed at checkout. All payment information is processed securely through our third-party payment processors.</p>
              <p>You represent and warrant that you have the legal right to use any payment method you provide in connection with any purchase.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-section-shipping">Shipping</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
              <p>Novaatoz offers various shipping options to deliver your order. Estimated delivery times are provided for reference purposes only and are not guaranteed. Delivery times may vary based on your location, shipping method selected, and other factors beyond our control.</p>
              <p>Novaatoz is not responsible for delays caused by shipping carriers, weather conditions, customs processing for international orders, or other circumstances outside our control. Risk of loss and title for items purchased from Novaatoz pass to you upon delivery of the items to the carrier.</p>
              <p>For more detailed information about our shipping options and policies, please visit our <Link href="/shipping-returns" className="text-primary hover:underline" data-testid="link-shipping-returns">Shipping & Returns</Link> page.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-section-returns-refunds">Returns and Refunds</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
              <p>Novaatoz offers a 30-day return policy from the date of delivery. To be eligible for a return, items must meet the following conditions:</p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>The item must be unused and in its original condition</li>
                <li>The item must be in its original packaging with all accessories included</li>
                <li>You must provide proof of purchase (order confirmation or receipt)</li>
                <li>The return must be initiated within 30 days of receiving your order</li>
              </ul>
              <p>Once your return is received and inspected, we will send you an email notification regarding the approval or rejection of your refund. Approved refunds will be processed to your original payment method within 5-10 business days.</p>
              <p>Certain items may not be eligible for return, including personalized products, replacement tips that have been opened, and items marked as final sale.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-section-warranty">Warranty</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
              <p>All Novaatoz devices are covered by a 1-year limited warranty from the date of original purchase. This warranty covers defects in materials and workmanship under normal use and service conditions.</p>
              <p>The warranty does not cover:</p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>Damage resulting from accident, misuse, abuse, or negligence</li>
                <li>Damage caused by service performed by anyone other than an authorized Novaatoz service provider</li>
                <li>Damage resulting from failure to follow the product instructions</li>
                <li>Normal wear and tear, including but not limited to scratches, dents, and worn nozzle tips</li>
                <li>Consumable parts such as nozzle tips and filters</li>
              </ul>
              <p>To make a warranty claim, please contact our support team with your proof of purchase and a description of the issue. Novaatoz will, at its sole discretion, repair or replace the defective product.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-section-limitation-liability">Limitation of Liability</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
              <p>To the fullest extent permitted by applicable law, Novaatoz shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses, resulting from:</p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>Your access to, use of, or inability to access or use our website or products</li>
                <li>Any conduct or content of any third party on the website</li>
                <li>Any content obtained from the website</li>
                <li>Unauthorized access, use, or alteration of your transmissions or content</li>
              </ul>
              <p>In no event shall Novaatoz's total liability to you for all claims exceed the amount you paid to Novaatoz for the product giving rise to the claim. This limitation of liability applies regardless of the legal theory on which the claim is based.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-section-contact">Contact Information</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
              <p>If you have any questions about these Terms of Service, please contact us:</p>
              <ul className="list-none space-y-2 pl-2">
                <li>Email: legal@novaatoz.com</li>
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
