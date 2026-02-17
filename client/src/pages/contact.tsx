import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ContactPage() {
  const { toast } = useToast();
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/contact", form);
      toast({ title: "Message Sent!", description: "We'll get back to you within 24 hours." });
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      toast({ title: "Error", description: "Failed to send message. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-primary text-sm font-bold tracking-widest uppercase mb-4">Get in Touch</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6" data-testid="text-contact-title">Contact Us</h1>
          <p className="text-muted-foreground text-lg">Have a question about our products or need support? We're here to help.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full rounded-md border border-border bg-card px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary text-sm"
                    placeholder="Your name"
                    data-testid="input-contact-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="w-full rounded-md border border-border bg-card px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary text-sm"
                    placeholder="you@example.com"
                    data-testid="input-contact-email"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                  className="w-full rounded-md border border-border bg-card px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary text-sm"
                  placeholder="How can we help?"
                  data-testid="input-contact-subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  rows={6}
                  className="w-full rounded-md border border-border bg-card px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary text-sm resize-none"
                  placeholder="Tell us more..."
                  data-testid="input-contact-message"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-primary px-8 py-3 text-sm font-bold text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-send-message"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>

          <div className="space-y-8">
            {[
              { icon: Mail, title: "Email", value: settings?.supportEmail || "support@novaatoz.com", sub: "We reply within 24 hours" },
              { icon: Phone, title: "Phone", value: settings?.supportPhone || "+1 (800) 555-0199", sub: "Mon-Fri, 9am-5pm PST" },
              { icon: MapPin, title: "Office", value: settings?.storeAddress || "123 Innovation Drive, San Francisco, CA 94105", sub: "United States" },
              { icon: Clock, title: "Hours", value: "Mon-Fri 9am-5pm", sub: "Pacific Standard Time" },
            ].map((item, i) => (
              <div key={i} className="flex gap-4" data-testid={`contact-info-${i}`}>
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-foreground font-semibold">{item.title}</p>
                  <p className="text-muted-foreground text-sm">{item.value}</p>
                  <p className="text-muted-foreground/60 text-xs mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
