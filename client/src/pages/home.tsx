import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Droplets, Waves, VolumeX, CheckCircle, XCircle, Minus } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { HOME_GALLERY_SETTINGS_KEY, parseHomeGalleryImages } from "@/lib/home-gallery";
import type { Product, Review } from "@shared/schema";

const HERO_FALLBACK = {
  name: "JetClean Pro",
  slug: "jetclean-pro",
  badge: "Flagship",
};

function HeroSection() {
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    staleTime: 60_000,
  });
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  // Hero: show one product image based on priority (hero toggle, featured, then fallback)
  const showOnHeroList = products?.filter((p) => (p as { showOnHero?: boolean }).showOnHero) ?? [];
  const featured = products?.filter((p) => p.isFeatured) ?? [];
  const rest = products?.filter((p) => !p.isFeatured) ?? [];
  const heroProduct =
    showOnHeroList[0] ?? featured[0] ?? rest[0] ?? null;
  const fallbackImage =
    settings?.heroFallbackImage?.trim() || "/images/hero-product.png";
  const current = heroProduct
    ? {
        name: heroProduct.name,
        slug: heroProduct.slug,
        image: heroProduct.image,
        badge: heroProduct.badge || "Featured",
      }
    : { ...HERO_FALLBACK, image: fallbackImage };

  return (
    <section className="relative overflow-hidden py-24 sm:py-36 lg:py-44" data-testid="section-hero">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/8 rounded-full blur-[140px] -z-10" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-8 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium tracking-wider uppercase text-primary w-fit" data-testid="badge-new-release">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
              </span>
              New Release
            </div>
            <Link href="/shop" className="w-fit">
              <button
                type="button"
                className="relative z-10 flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground h-12 px-8 text-sm font-semibold tracking-wide shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                data-testid="button-hero-shop-now"
              >
                Shop Now
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal tracking-tight leading-[1.15] text-foreground">
              The Art of <br />
              <span className="text-primary italic">
                Daily Care
              </span>
            </h1>
            <p className="text-base text-muted-foreground max-w-md leading-relaxed">
              NOVAATOZ is a premium oral care brand specializing in cordless water flossers designed for deep cleaning and everyday dental hygiene. Our rechargeable water flossers use high-pressure pulse technology to remove plaque, food debris, and bacteria from between teeth and along the gumline - areas traditional brushing and string floss often miss.
              <br />
              <br />
              Whether you are looking for a portable water flosser for travel, a water flosser for braces, or a rechargeable oral irrigator for sensitive gums, NOVAATOZ delivers powerful performance with comfort and convenience. Our waterproof, USB-rechargeable dental water flossers are ideal for braces, implants, crowns, and daily gum care.
              <br />
              <br />
              Upgrade your oral hygiene routine with a compact, cordless water flosser engineered for effective plaque removal, fresher breath, and healthier gums - all from the comfort of home.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/shop">
                <button className="flex items-center justify-center gap-2 rounded-full bg-foreground h-11 px-7 text-sm font-medium tracking-wide text-background transition-all hover:bg-foreground/90" data-testid="button-shop-hero">
                  Explore Collection
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
              <Link href={`/product/${current.slug}`}>
                <button className="flex items-center justify-center rounded-full border border-border h-11 px-7 text-sm font-medium tracking-wide text-foreground transition-all hover:bg-accent/50" data-testid="button-watch-demo">
                  Learn More
                </button>
              </Link>
            </div>
          </div>
          <div className="relative lg:h-[680px] flex items-center justify-center">
            <div className="absolute w-[460px] h-[460px] border border-primary/10 rounded-full" />
            <div className="absolute w-[600px] h-[600px] border border-border/30 rounded-full" />
            <div className="relative z-10 w-full max-w-xl aspect-[3/4] rounded-3xl bg-gradient-to-b from-accent/50 to-card p-1 shadow-xl">
              <div className="h-full w-full rounded-[22px] bg-card overflow-hidden relative">
                <video
                  key={current.slug}
                  className="h-full w-full object-cover transition-opacity duration-300"
                  src="/videos/hero.mp4"
                  poster={current.image}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                >
                  <img
                    alt={current.name}
                    className="h-full w-full object-cover"
                    src={current.image}
                  />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="flex justify-between items-end gap-4">
                    <div>
                      <p className="text-white/70 text-xs font-medium tracking-[0.2em] uppercase">{current.badge}</p>
                      <h3 className="text-white text-xl font-serif">{current.name}</h3>
                    </div>
                    <Link href={`/product/${current.slug}`}>
                      <div className="h-9 w-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center hover:bg-white/25 transition-colors cursor-pointer" data-testid="button-hero-product-link">
                        <ArrowRight className="h-4 w-4 text-white" />
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ValuePropsSection() {
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    staleTime: 60_000,
  });
  const featured = products?.find((p) => p.isFeatured);
  const fallback = products?.[0];
  const whyImage = (settings?.whyProductImage || "").trim() || featured?.image || fallback?.image || "/images/hero-product.png";
  const showWhyImage = settings?.showWhyProductImage !== "false";

  const features = [
    { icon: Waves, title: "Advanced Hyper-Pulse Technology", desc: "High-Pressure Cordless Water Flosser for Deep Cleaning. Delivers up to 1200 pulses per minute to remove plaque, food debris, and bacteria from between teeth and along the gumline. Designed as a powerful rechargeable water flosser for effective gum care and deep cleaning beyond traditional brushing." },
    { icon: VolumeX, title: "Ultra-Quiet Operation", desc: "Low-Noise Portable Dental Water Flosser. Engineered to operate below 50dB, this portable water flosser provides powerful cleaning without disturbing your morning or nighttime routine. Ideal for home use, travel, and shared spaces." },
    { icon: Droplets, title: "Waterproof IPX7 Design", desc: "Shower-Safe Rechargeable Oral Irrigator. Built with IPX7 waterproof protection, this cordless water flosser is fully shower-ready and easy to clean. Perfect for everyday use, braces, and sensitive gum care." },
  ];

  return (
    <section className="py-28 bg-background relative" data-testid="section-value-props">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-12 items-start">
          <div className="max-w-2xl">
            <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-3">Why Novaatoz</p>
            <h2 className="text-3xl font-serif tracking-tight text-foreground sm:text-4xl mb-4">Crafted with Purpose. Designed for Performance.</h2>
            <p className="text-muted-foreground leading-relaxed">
              At NOVAATOZ, advanced engineering blends with thoughtful design to deliver a smarter oral care experience. We eliminate unnecessary features and focus on what truly matters - powerful cleaning, comfort, and reliability.
              <br />
              <br />
              Our cordless and rechargeable water flossers are built for modern lifestyles, offering portable convenience without compromising performance. Whether you need a dental water flosser for everyday use, a water flosser for braces, or a deep cleaning oral irrigator for improved gum care, NOVAATOZ delivers precision and effectiveness in every use.
              <br />
              <br />
              From portable water flosser solutions to advanced gum care technology, we create oral hygiene devices designed to make deep cleaning simple, comfortable, and efficient.
            </p>
            <Link href="/shop" className="mt-6 inline-flex items-center gap-2 text-sm font-medium tracking-wide text-foreground hover:text-primary transition-colors" data-testid="link-full-specs">
              View all products <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {showWhyImage && (
            <div className="w-full lg:max-w-[520px] lg:justify-self-end">
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/50 shadow-sm">
                <img
                  src={whyImage}
                  alt="Novaatoz product"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="group relative overflow-visible rounded-2xl border border-border/60 bg-card/50 p-8 transition-all hover:border-primary/30 hover:shadow-md" data-testid={`card-feature-${i}`}>
              <div className="mb-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/8 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-foreground">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GalleryMarqueeSection() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });
  const galleryImages = parseHomeGalleryImages(settings?.[HOME_GALLERY_SETTINGS_KEY]);

  const midpoint = Math.ceil(galleryImages.length / 2);
  const row1 = galleryImages.slice(0, midpoint);
  const row2 = galleryImages.slice(midpoint);
  const marqueeRow1 = row1.length > 0 ? row1 : galleryImages;
  const marqueeRow2 = row2.length > 0 ? row2 : marqueeRow1;

  return (
    <section className="py-24 bg-section-alt border-t border-border/40 overflow-hidden" data-testid="section-gallery">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-14">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-3">Gallery</p>
          <h2 className="text-3xl font-serif tracking-tight text-foreground sm:text-4xl mb-4">Designed for Perfection</h2>
          <p className="text-muted-foreground leading-relaxed">Every angle, every detail - crafted with precision engineering and premium materials.</p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex animate-marquee-left">
          {[...marqueeRow1, ...marqueeRow1, ...marqueeRow1].map((src, i) => (
            <div key={i} className="flex-shrink-0 w-[300px] h-[200px] mx-2 rounded-2xl overflow-hidden border border-border/40">
              <img src={src} alt={`Product showcase ${(i % marqueeRow1.length) + 1}`} className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
        <div className="flex animate-marquee-right">
          {[...marqueeRow2, ...marqueeRow2, ...marqueeRow2].map((src, i) => (
            <div key={i} className="flex-shrink-0 w-[300px] h-[200px] mx-2 rounded-2xl overflow-hidden border border-border/40">
              <img src={src} alt={`Product showcase ${(i % marqueeRow2.length) + marqueeRow1.length + 1}`} className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedProductsSection() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    staleTime: 0,
    refetchOnMount: "always",
  });
  const { addItem } = useCartStore();

  return (
    <section className="py-28 border-t border-border/40 bg-section-alt" data-testid="section-featured-products">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-3">Collection</p>
            <h2 className="text-3xl font-serif tracking-tight text-foreground sm:text-4xl">Featured Products</h2>
          </div>
          <Link href="/shop" className="text-sm font-medium tracking-wide text-foreground hidden sm:flex items-center gap-2 hover:text-primary transition-colors" data-testid="link-view-all-products">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
      <div className="w-full overflow-x-auto pb-8 px-4 sm:px-6 lg:px-8" style={{ scrollbarWidth: "none" }}>
        <div className="flex gap-6 mx-auto max-w-7xl min-w-max">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-[300px] rounded-2xl border border-border/60 bg-card overflow-hidden">
                  <div className="aspect-[4/5] bg-muted animate-pulse" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                    <div className="h-3 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))
            : products?.filter(p => p.isFeatured)?.map((product) => (
                <div key={product.id} className="flex w-[300px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:shadow-lg hover:border-primary/20 group" data-testid={`card-product-${product.id}`}>
                  <Link href={`/product/${product.slug}`}>
                    <div className="relative aspect-[4/5] w-full bg-muted overflow-hidden cursor-pointer">
                      <img
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        src={product.image}
                      />
                      {product.badge && (
                        <div className="absolute top-4 left-4 rounded-full px-3 py-1 text-[10px] font-medium tracking-wider uppercase bg-background/90 backdrop-blur text-foreground border border-border/50" data-testid={`badge-${product.slug}`}>
                          {product.badge}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex justify-between items-start mb-2 gap-2 flex-wrap">
                      <h3 className="text-base font-medium text-foreground">{product.name}</h3>
                      <span className="text-foreground font-medium">${product.price}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-5 flex-1 leading-relaxed">{product.shortDescription}</p>
                    <div className="flex gap-2">
                      <Link href={`/product/${product.slug}`} className="flex-1">
                        <button className="w-full rounded-full border border-border py-2 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors" data-testid={`button-view-${product.slug}`}>
                          View Details
                        </button>
                      </Link>
                      <button
                        onClick={() => addItem({ id: product.id, name: product.name, price: product.price, image: product.image })}
                        className="rounded-full bg-foreground py-2 px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
                        data-testid={`button-add-cart-${product.slug}`}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  const rows = [
    { feature: "Plaque Removal Effectiveness", nova: "99.9%", novaExtra: null, floss: "~60%", flossExtra: null, novaGood: true, flossGood: false },
    { feature: "Gum Health Improvement", nova: null, novaExtra: "Clinically Proven", floss: null, flossExtra: "Often causes bleeding", novaGood: true, flossGood: false },
    { feature: "Time Required", nova: "60 Seconds", novaExtra: null, floss: "3-5 Minutes", flossExtra: null, novaGood: true, flossGood: false },
    { feature: "Braces & Implant Friendly", nova: null, novaExtra: null, floss: null, flossExtra: null, novaGood: true, flossGood: false },
    { feature: "Tech Integration", nova: null, novaExtra: "Smart Pressure Sensor", floss: null, flossExtra: null, novaGood: true, flossGood: false },
  ];

  return (
    <section className="py-28 bg-background relative overflow-hidden" data-testid="section-comparison">
      <div className="absolute right-0 top-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-3">Comparison</p>
          <h2 className="text-3xl font-serif tracking-tight text-foreground sm:text-4xl mb-4">Novaatoz vs. Traditional</h2>
          <p className="text-muted-foreground leading-relaxed">See how modern hydro-technology compares to traditional methods.</p>
        </div>
        <div className="rounded-2xl overflow-hidden border border-border/60 bg-card/40 backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="p-6 text-xs font-medium tracking-wider uppercase text-muted-foreground w-1/3">Feature</th>
                  <th className="p-6 text-base font-medium text-primary w-1/3 text-center bg-primary/5">
                    <div className="flex flex-col items-center gap-1">
                      <Droplets className="h-5 w-5" />
                      <span>Novaatoz</span>
                    </div>
                  </th>
                  <th className="p-6 text-base font-medium text-muted-foreground w-1/3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Minus className="h-5 w-5" />
                      <span>String Floss</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td className="p-6 text-foreground text-sm font-medium">{row.feature}</td>
                    <td className="p-6 text-center bg-primary/5">
                      {row.nova ? (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                          {row.nova}
                        </span>
                      ) : row.novaGood ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-primary mx-auto" />
                          {row.novaExtra && <span className="block text-xs text-muted-foreground mt-1">{row.novaExtra}</span>}
                        </>
                      ) : null}
                    </td>
                    <td className="p-6 text-center text-muted-foreground">
                      {row.floss ? (
                        <span className="text-sm">{row.floss}</span>
                      ) : row.flossGood === false ? (
                        <>
                          <XCircle className="h-5 w-5 text-destructive/60 mx-auto" />
                          {row.flossExtra && <span className="block text-xs text-muted-foreground mt-1">{row.flossExtra}</span>}
                        </>
                      ) : (
                        <Minus className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewsPreviewSection() {
  const { data: reviews } = useQuery<Review[]>({ queryKey: ["/api/reviews"] });
  const displayReviews = reviews?.slice(0, 3) || [];

  return (
    <section className="py-28 bg-section-alt border-t border-border/40" data-testid="section-reviews-preview">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-14">
          <div>
            <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-3">Testimonials</p>
            <h2 className="text-3xl font-serif tracking-tight text-foreground sm:text-4xl mb-3">What Our Customers Say</h2>
            <p className="text-muted-foreground leading-relaxed">Real reviews from real customers who made the switch.</p>
          </div>
          <Link href="/reviews" className="hidden md:flex items-center gap-2 text-sm font-medium tracking-wide text-foreground hover:text-primary transition-colors" data-testid="link-all-reviews">
            All Reviews <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayReviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-border/60 bg-card/50 p-7" data-testid={`card-review-${review.id}`}>
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className={`h-4 w-4 ${i < review.rating ? "text-amber-400" : "text-muted/60"}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <h4 className="text-foreground font-medium mb-2">{review.title}</h4>
              <p className="text-muted-foreground text-sm mb-5 leading-relaxed">{review.body}</p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                  {review.customerName.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">{review.customerName}</p>
                  {review.verified && <p className="text-primary text-xs">Verified Purchase</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-28 bg-background relative overflow-hidden" data-testid="section-cta">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/30" />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-4">Get Started</p>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-foreground mb-6 leading-tight">Ready to Elevate Your Routine?</h2>
        <p className="text-muted-foreground text-base mb-10 max-w-xl mx-auto leading-relaxed">
          Join thousands who've already upgraded their oral care. Free shipping on orders over $75. 1-year warranty on all devices.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/shop">
            <button className="rounded-full bg-foreground h-11 px-8 text-sm font-medium tracking-wide text-background transition-all hover:bg-foreground/90" data-testid="button-shop-cta">
              Shop Collection
            </button>
          </Link>
          <Link href="/about">
            <button className="rounded-full border border-border h-11 px-8 text-sm font-medium tracking-wide text-foreground transition-all hover:bg-accent/50" data-testid="button-learn-more-cta">
              Our Story
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <ValuePropsSection />
      <GalleryMarqueeSection />
      <FeaturedProductsSection />
      <ComparisonSection />
      <ReviewsPreviewSection />
      <CTASection />
    </div>
  );
}
