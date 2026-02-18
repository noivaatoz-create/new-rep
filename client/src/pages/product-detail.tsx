import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useCartStore } from "@/lib/cart-store";
import { useEffect, useMemo, useState } from "react";
import type { ProductWithColorVariants, ProductColorVariant } from "@shared/color-variants";
import type { Review } from "@shared/schema";
import { Minus, Plus, Truck, ShieldCheck, Droplets, Battery, Waves, Shield, ArrowRight, CheckCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function ProductDetailPage() {
  const [, params] = useRoute("/product/:slug");
  const slug = params?.slug;
  const { data: products, isLoading } = useQuery<ProductWithColorVariants[]>({
    queryKey: ["/api/products"],
    staleTime: 0,
    refetchOnMount: "always",
  });
  const { data: reviews } = useQuery<Review[]>({ queryKey: ["/api/reviews"] });
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState("");

  const product = slug ? products?.find((p) => p.slug === slug) : undefined;
  const productReviews = reviews?.filter((r) => r.productId === product?.id) || [];

  const colorVariants = useMemo(
    () =>
      (Array.isArray(product?.colorVariants) ? product.colorVariants : []).filter(
        (variant: ProductColorVariant) => variant?.images?.length > 0
      ),
    [product?.colorVariants]
  );
  const fallbackImages = useMemo(
    () => [product?.image, ...(Array.isArray(product?.images) ? product.images : [])].filter(Boolean) as string[],
    [product?.image, product?.images]
  );
  const activeVariant = colorVariants[selectedColorIndex];
  const galleryImages = (activeVariant?.images?.length ? activeVariant.images : fallbackImages).filter(Boolean);
  const mainImage = selectedImage || galleryImages[0] || product?.image || "";

  useEffect(() => {
    if (!product) return;
    setSelectedColorIndex(0);
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    const variantImages = colorVariants[selectedColorIndex]?.images?.filter(Boolean) || [];
    const nextImages = variantImages.length > 0 ? variantImages : fallbackImages;
    setSelectedImage(nextImages[0] || product.image);
  }, [product?.id, selectedColorIndex, colorVariants, fallbackImages, product?.image]);

  if (!slug || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-16">
            <div className="aspect-square bg-muted rounded-2xl animate-pulse" />
            <div className="space-y-4 py-8">
              <div className="h-3 bg-muted rounded animate-pulse w-1/4" />
              <div className="h-8 bg-muted rounded animate-pulse w-2/3" />
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-foreground mb-4">Product Not Found</h1>
          <Link href="/shop">
            <button className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background">
              Back to Shop
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const specs = (product.specs != null ? product.specs : null) as Record<string, string> | null;
  const features = Array.isArray(product.features) ? product.features : [];
  const whatsInBox = Array.isArray(product.whatsInBox) ? product.whatsInBox : [];

  const specIcons: Record<string, typeof Droplets> = {
    "Pressure": Droplets,
    "Battery Life": Battery,
    "Pulse Tech": Waves,
    "Protection": Shield,
    "Tank Capacity": Droplets,
    "Modes": Waves,
    "Weight": Shield,
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({ id: product.id, name: product.name, price: product.price, image: mainImage });
    }
  };

  const avgRating = productReviews.length > 0
    ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-10" data-testid="breadcrumb">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span className="text-border">/</span>
          <Link href="/shop" className="hover:text-foreground transition-colors">Shop</Link>
          <span className="text-border">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden bg-card border border-border/60">
              <img
                alt={product.name}
                className="h-full w-full object-cover"
                src={mainImage}
                data-testid="img-product-main"
              />
            </div>
            {product.badge && (
              <div className="absolute top-4 left-4 rounded-full px-3 py-1.5 text-[10px] font-medium tracking-wider uppercase bg-background/90 backdrop-blur text-foreground border border-border/50" data-testid="badge-product">
                {product.badge}
              </div>
            )}
            {galleryImages.length > 1 && (
              <div className="mt-4 grid grid-cols-5 gap-2" data-testid="product-image-thumbnails">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-colors ${
                      mainImage === image ? "border-primary" : "border-border/40 hover:border-primary/40"
                    }`}
                    data-testid={`button-product-thumb-${index}`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6 lg:py-4">
            <div>
              <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-3" data-testid="text-category">{product.category}</p>
              <h1 className="text-3xl sm:text-4xl font-serif text-foreground mb-3" data-testid="text-product-name">{product.name}</h1>

              {productReviews.length > 0 && (
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} className={`h-4 w-4 ${i < Math.round(avgRating) ? "text-amber-400" : "text-muted/60"}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-muted-foreground text-sm">({productReviews.length} reviews)</span>
                </div>
              )}

              <div className="flex items-baseline gap-3 mb-5">
                <span className="text-2xl font-medium text-foreground" data-testid="text-product-price">${product.price}</span>
                {product.compareAtPrice && (
                  <span className="text-base text-muted-foreground line-through">${product.compareAtPrice}</span>
                )}
              </div>
              <p className="text-muted-foreground leading-relaxed" data-testid="text-product-description">{product.longDescription}</p>
            </div>

            {colorVariants.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-foreground text-sm font-medium">Color:</p>
                  <p className="text-muted-foreground text-sm">{activeVariant?.name}</p>
                </div>
                <div className="flex flex-wrap gap-2" data-testid="product-color-options">
                  {colorVariants.map((variant, index) => (
                    <button
                      key={`${variant.name}-${index}`}
                      type="button"
                      onClick={() => setSelectedColorIndex(index)}
                      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all ${
                        index === selectedColorIndex ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                      }`}
                      data-testid={`button-color-${variant.name.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <span className="h-4 w-4 rounded-full border border-border/50" style={{ backgroundColor: variant.swatch || "#272c40" }} />
                      {variant.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {features.length > 0 && (
              <div className="space-y-2.5">
                {features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">{f}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-b border-border/60 py-7">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-foreground font-medium text-sm">Quantity:</span>
                <div className="flex items-center gap-3 border border-border rounded-full">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2.5 text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="button-decrease-qty"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-foreground font-medium min-w-[24px] text-center text-sm" data-testid="text-quantity">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2.5 text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="button-increase-qty"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="text-muted-foreground text-sm">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</span>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-foreground h-12 text-sm font-medium tracking-wide text-background transition-all hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed group"
                data-testid="button-add-to-cart"
              >
                Add to Cart - ${(parseFloat(product.price) * quantity).toFixed(2)}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="flex items-center justify-center gap-8 text-xs font-medium text-muted-foreground mt-5">
                <div className="flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-primary" />
                  Free 2-Day Shipping
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  2-Year Warranty
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-28 space-y-28">
          {specs && Object.keys(specs).length > 0 && (
            <section>
              <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-3">Specifications</p>
              <h3 className="text-2xl font-serif text-foreground mb-10" data-testid="text-specs-title">Technical Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(specs).map(([key, value]) => {
                  const Icon = specIcons[key] || Shield;
                  return (
                    <div key={key} className="bg-card/50 p-6 rounded-2xl border border-border/60 flex flex-col gap-4 group hover:border-primary/30 transition-colors" data-testid={`spec-${key.toLowerCase().replace(/\s/g, "-")}`}>
                      <div className="h-10 w-10 rounded-full bg-primary/8 text-primary flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase text-[10px] font-medium tracking-[0.15em] mb-1">{key}</p>
                        <p className="text-lg font-medium text-foreground">{value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {whatsInBox.length > 0 && (
            <section className="flex flex-col md:flex-row gap-16 items-center">
              <div className="w-full md:w-1/2">
                <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-3">Included</p>
                <h3 className="text-2xl font-serif text-foreground mb-8" data-testid="text-whats-in-box">What's in the Box</h3>
                <ul className="space-y-3">
                  {whatsInBox.map((item, i) => (
                    <li key={i} className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-border/60">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="font-medium text-foreground text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-full md:w-1/2 relative">
                <div className="relative z-10 aspect-square bg-card rounded-2xl overflow-hidden border border-border/60">
                  <img
                    alt="What's in the box"
                    className="w-full h-full object-cover"
                    src="/images/whats-in-box.png"
                  />
                </div>
              </div>
            </section>
          )}

          <section className="max-w-3xl mx-auto w-full">
            <div className="text-center mb-10">
              <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-3">Support</p>
              <h3 className="text-2xl font-serif text-foreground" data-testid="text-faq-title">Frequently Asked Questions</h3>
            </div>
            <Accordion type="single" collapsible className="space-y-3">
              <AccordionItem value="nozzle" className="bg-card/50 rounded-xl border border-border/60 px-6">
                <AccordionTrigger className="text-foreground text-sm font-medium hover:no-underline" data-testid="accordion-nozzle">
                  How often should I change the nozzle?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  We recommend replacing the nozzle every 3 months for optimal hygiene and performance. The JetClean Pro comes with 4 nozzles, providing a year's supply out of the box.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="sensitive" className="bg-card/50 rounded-xl border border-border/60 px-6">
                <AccordionTrigger className="text-foreground text-sm font-medium hover:no-underline" data-testid="accordion-sensitive">
                  Is it safe for sensitive gums?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  Absolutely. The device features a 'Soft' mode specifically designed for sensitive gums or first-time users. You can gradually increase intensity as your gums become healthier.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="mouthwash" className="bg-card/50 rounded-xl border border-border/60 px-6">
                <AccordionTrigger className="text-foreground text-sm font-medium hover:no-underline" data-testid="accordion-mouthwash">
                  Can I use mouthwash in the reservoir?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  Yes, you can add a small amount of mouthwash mixed with water to the reservoir for an extra fresh feeling. We recommend a 1:1 ratio of mouthwash to water.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="warranty" className="bg-card/50 rounded-xl border border-border/60 px-6">
                <AccordionTrigger className="text-foreground text-sm font-medium hover:no-underline" data-testid="accordion-warranty">
                  What does the warranty cover?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  All Novaatoz devices come with a 2-year limited warranty covering manufacturing defects and motor issues. This does not cover physical damage from drops or misuse.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          {productReviews.length > 0 && (
            <section>
              <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-3">Testimonials</p>
              <h3 className="text-2xl font-serif text-foreground mb-10" data-testid="text-reviews-title">Customer Reviews</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {productReviews.map((review) => (
                  <div key={review.id} className="rounded-2xl border border-border/60 bg-card/50 p-7" data-testid={`review-${review.id}`}>
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
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
