import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "wouter";

const faqs = [
  {
    category: "Product",
    items: [
      { q: "How does a water flosser work?", a: "A water flosser uses a targeted stream of pulsating water to remove food debris and plaque between teeth and below the gumline. It's clinically proven to be more effective than traditional string floss for improving gum health." },
      { q: "Which model is right for me?", a: "The JetClean Pro is our flagship countertop model, perfect for home use with 10 pressure settings. The TravelPulse Mini is ideal if you travel frequently. The FamilyTank XL is designed for households with multiple users thanks to its large reservoir." },
      { q: "How often should I replace the nozzle tips?", a: "We recommend replacing nozzle tips every 3 months for optimal hygiene. The JetClean Pro includes 4 nozzles to get you started with a year's supply." },
      { q: "Can I use mouthwash in the reservoir?", a: "Yes! You can add mouthwash mixed with water (1:1 ratio) for an extra fresh clean. Avoid using essential oils or thick solutions." },
      { q: "Is it safe for braces and implants?", a: "Absolutely. Water flossers are actually recommended by orthodontists for braces care. Use the 'Soft' mode initially and work your way up." },
    ],
  },
  {
    category: "Shipping & Returns",
    items: [
      { q: "How long does shipping take?", a: "We offer free 2-day shipping on orders over $75 within the continental US. Standard shipping takes 5-7 business days. International shipping typically takes 7-14 business days." },
      { q: "Do you ship internationally?", a: "Yes, we ship to over 25 countries worldwide. International shipping rates are calculated at checkout based on your location." },
      { q: "What is your return policy?", a: "We offer a 30-day money-back guarantee. If you're not completely satisfied, return your product in its original packaging for a full refund. We'll even cover return shipping." },
      { q: "Can I track my order?", a: "Yes! Once your order ships, you'll receive an email with a tracking number. You can also track your order on our Track Order page." },
    ],
  },
  {
    category: "Warranty & Support",
    items: [
      { q: "What does the warranty cover?", a: "All Novaatoz devices come with a 2-year limited warranty covering manufacturing defects, motor issues, and battery problems. This does not cover physical damage from drops or misuse." },
      { q: "How do I contact support?", a: "You can reach us via email at support@novaatoz.com, call us at +1 (888) 555-0123 (Mon-Fri, 9am-5pm PST), or use the contact form on our website." },
      { q: "My device isn't working properly. What should I do?", a: "First, try charging the device fully and resetting it by holding the power button for 10 seconds. If the issue persists, contact our support team and we'll help troubleshoot or arrange a replacement under warranty." },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <p className="text-primary text-sm font-bold tracking-widest uppercase mb-4">Support</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6" data-testid="text-faq-title">Frequently Asked Questions</h1>
          <p className="text-muted-foreground text-lg">Everything you need to know about Novaatoz products.</p>
        </div>

        <div className="space-y-12">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="text-xl font-bold text-foreground mb-6" data-testid={`text-faq-category-${section.category.toLowerCase().replace(/\s/g, "-")}`}>
                {section.category}
              </h2>
              <Accordion type="single" collapsible className="space-y-3">
                {section.items.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`${section.category}-${i}`}
                    className="bg-card rounded-md border border-border px-6"
                  >
                    <AccordionTrigger className="text-foreground text-base font-medium hover:no-underline" data-testid={`accordion-faq-${section.category.toLowerCase().replace(/\s/g, "-")}-${i}`}>
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center p-8 rounded-md border border-border bg-card">
          <h3 className="text-xl font-bold text-foreground mb-3">Still have questions?</h3>
          <p className="text-muted-foreground mb-6">Our support team is here to help you with anything you need.</p>
          <Link href="/contact">
            <button className="rounded-md bg-primary px-8 py-3 text-sm font-bold text-foreground transition-all" data-testid="button-contact-us">
              Contact Us
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
