import { Droplets, Award, Users, Globe } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[100px] -z-10" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-primary text-sm font-bold tracking-widest uppercase mb-4">Our Story</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6" data-testid="text-about-title">
              Redefining Oral Care for the Future
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              At Novaatoz, we believe that daily hygiene should be an experience, not a chore. We combine cutting-edge hydro-technology with cyber-minimalist design to create products that people actually want to use.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
            {[
              { icon: Droplets, label: "Founded", value: "2022" },
              { icon: Users, label: "Happy Customers", value: "50,000+" },
              { icon: Award, label: "Awards Won", value: "12" },
              { icon: Globe, label: "Countries", value: "25+" },
            ].map((stat, i) => (
              <div key={i} className="text-center p-8 rounded-md border border-border bg-card" data-testid={`stat-${i}`}>
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-4" />
                <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We started Novaatoz with a simple observation: dental care technology hadn't kept up with the rest of our lives. While everything else got smarter and sleeker, the tools we use for our most fundamental hygiene remained stuck in the past.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our team of dental professionals and industrial designers came together to create something different. Something that feels like it belongs in 2025, not 1995.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Every Novaatoz product is engineered in California, tested with real dental professionals, and designed to make you actually look forward to flossing.
              </p>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-card border border-border">
                <img src="/images/hero-product.png" alt="Novaatoz product" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-50" />
              </div>
            </div>
          </div>

          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "Innovation First", desc: "We never stop pushing the boundaries of what oral care technology can do." },
                { title: "Design Matters", desc: "Every curve, every button, every LED is intentional. Beauty meets function." },
                { title: "Customer Obsessed", desc: "Your feedback drives our roadmap. We build what you actually need." },
              ].map((val, i) => (
                <div key={i} className="p-6" data-testid={`value-${i}`}>
                  <h3 className="text-foreground font-bold text-lg mb-3">{val.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{val.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
