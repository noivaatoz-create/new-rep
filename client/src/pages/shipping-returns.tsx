import { Link } from "wouter";

export default function ShippingReturnsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-primary text-sm font-bold tracking-widest uppercase mb-4">Policies</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6" data-testid="text-page-title">Shipping & Returns</h1>
          <p className="text-muted-foreground text-lg">Everything you need to know about how we ship your orders and handle returns at Novaatoz.</p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-section-shipping-policy">Shipping Policy</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
              <p>Novaatoz is committed to delivering your orders quickly and reliably. We offer the following shipping options for domestic orders within the United States:</p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>Standard Shipping (5-7 business days): Free on orders over $75, otherwise $5.99</li>
                <li>Express Shipping (2-3 business days): $12.99</li>
                <li>Overnight Shipping (1 business day): $24.99</li>
              </ul>
              <p>All shipping times are estimates and begin from the date your order is shipped, not the date it is placed. Novaatoz is not responsible for delays caused by shipping carriers, weather events, or other circumstances beyond our control.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-section-international-shipping">International Shipping</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
              <p>Novaatoz ships internationally to select countries. International shipping rates and delivery estimates are calculated at checkout based on your destination and the weight of your order.</p>
              <p>Please note the following for international orders:</p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>Delivery typically takes 7-14 business days depending on the destination</li>
                <li>Customs duties, taxes, and import fees are the responsibility of the customer and are not included in the order total</li>
                <li>Some products may not be available for international shipping due to regulatory restrictions</li>
                <li>Novaatoz is not responsible for delays caused by customs processing</li>
              </ul>
              <p>For a complete list of countries we ship to, please check the shipping options at checkout or contact our support team.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-section-order-processing">Order Processing</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
              <p>Orders placed on novaatoz.com are typically processed within 1-2 business days. Orders placed on weekends or holidays will be processed on the next business day.</p>
              <p>Once your order has been processed and shipped, you will receive a confirmation email with a tracking number so you can monitor the delivery status of your package.</p>
              <p>During peak seasons or promotional events, processing times may be slightly longer. We will notify you if there are any significant delays with your order.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-section-returns">Returns</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
              <p>Novaatoz offers a 30-day return window from the date of delivery. We want you to be completely satisfied with your purchase, and if you are not, we are happy to help.</p>
              <p>To be eligible for a return, the following conditions must be met:</p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>The item must be unused, undamaged, and in its original condition</li>
                <li>The item must be in its original packaging with all accessories, manuals, and components included</li>
                <li>Proof of purchase (order number or receipt) must be provided</li>
                <li>The return request must be initiated within 30 days of receiving your order</li>
              </ul>
              <p>To start a return, please contact our support team at returns@novaatoz.com or through our <Link href="/contact" className="text-primary hover:underline" data-testid="link-contact-returns">Contact Us</Link> page. We will provide you with a return authorization number and shipping instructions.</p>
              <p>Items that are not eligible for return include opened consumable products (such as replacement nozzle tips and cleaning tablets), personalized items, and products marked as final sale.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-section-refund-process">Refund Process</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
              <p>Once your returned item is received at our facility, our team will inspect it to ensure it meets the return eligibility requirements. You will be notified by email once the inspection is complete.</p>
              <p>If your return is approved, a refund will be processed to your original payment method within 5-10 business days. Please note:</p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>Refunds are issued to the original payment method used at the time of purchase</li>
                <li>It may take an additional 3-5 business days for the refund to appear on your statement depending on your financial institution</li>
                <li>Original shipping charges are non-refundable unless the return is due to a Novaatoz error or a defective product</li>
              </ul>
              <p>If your return is rejected, we will contact you with an explanation and arrange for the item to be shipped back to you.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-section-exchanges">Exchanges</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
              <p>If you would like to exchange a product for a different model or color, please initiate a return for the original item and place a new order for the desired product. This ensures the fastest processing time for your exchange.</p>
              <p>If the replacement item is priced higher than the original, you will be charged the difference. If the replacement is priced lower, the difference will be refunded to your original payment method.</p>
              <p>Exchanges are subject to product availability. If the desired replacement item is out of stock, you may choose to wait for it to become available or receive a full refund for the returned item.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-section-damaged-items">Damaged Items</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
              <p>If you receive a damaged or defective item, please contact our support team within 48 hours of delivery. To help us resolve the issue as quickly as possible, please provide:</p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>Your order number</li>
                <li>A description of the damage or defect</li>
                <li>Photographs of the damaged item and packaging</li>
              </ul>
              <p>Novaatoz will cover all return shipping costs for damaged or defective items and will either send a replacement or issue a full refund at your preference. We may ask you to return the damaged item for quality assurance purposes.</p>
              <p>Please do not discard the damaged item or its packaging until the claim has been resolved.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4" data-testid="text-section-contact-support">Contact Us</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
              <p>If you have any questions about shipping, returns, or need assistance with an order, our support team is here to help:</p>
              <ul className="list-none space-y-2 pl-2">
                <li>Email: support@novaatoz.com</li>
                <li>Phone: +1 (800) 555-0199</li>
                <li>Hours: Monday - Friday, 9am - 5pm PST</li>
              </ul>
              <p>Visit our <Link href="/contact" className="text-primary hover:underline" data-testid="link-contact-support">Contact Us</Link> page for additional ways to reach us.</p>
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
