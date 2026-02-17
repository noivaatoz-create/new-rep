import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { setIsOpen, getItemCount } = useCartStore();
  const itemCount = getItemCount();
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });

  const allLinks = [
    { href: "/shop", label: "Shop", key: "showNavShop" },
    { href: "/about", label: "About", key: "showNavAbout" },
    { href: "/faq", label: "FAQ", key: "showNavFaq" },
    { href: "/contact", label: "Contact", key: "showNavContact" },
    { href: "/reviews", label: "Reviews", key: "showNavReviews" },
  ];
  const navLinks = allLinks.filter(l => settings?.[l.key] !== "false");

  const logoText = settings?.logoText || "NOVAATOZ";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-xl" data-testid="nav-header">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" data-testid="link-home">
          {settings?.showLogoIcon !== "false" && <img src="/images/novaatoz-logo.png" alt="Novaatoz" className="h-8 w-8 object-contain invert" />}
          <span className="font-serif text-xl tracking-wide text-foreground">{logoText}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[13px] font-medium tracking-widest uppercase transition-colors ${
                location === link.href
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`link-${link.label.toLowerCase()}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />

          <button
            onClick={() => setIsOpen(true)}
            className="relative flex items-center justify-center rounded-full p-2.5 text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-cart"
          >
            <ShoppingCart className="h-[18px] w-[18px]" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground" data-testid="text-cart-count">
                {itemCount}
              </span>
            )}
          </button>

          <Link href="/shop">
            <button
              className="hidden sm:flex items-center justify-center rounded-full border border-foreground/15 bg-foreground text-background px-5 py-1.5 text-[13px] font-medium tracking-wide transition-all hover:bg-foreground/90"
              data-testid="button-buy-now"
            >
              Shop Now
            </button>
          </Link>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden text-muted-foreground hover:text-foreground p-2" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background border-border w-[280px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 font-serif text-foreground">
                  {settings?.showLogoIcon !== "false" && <img src="/images/novaatoz-logo.png" alt="Novaatoz" className="h-7 w-7 object-contain invert" />}
                  {logoText}
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`text-sm font-medium tracking-wider uppercase transition-colors py-3 px-2 rounded-lg ${
                      location === link.href
                        ? "text-foreground bg-accent/50"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                    }`}
                    data-testid={`link-mobile-${link.label.toLowerCase()}`}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link href="/admin" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full mt-6 rounded-full" data-testid="link-mobile-admin">
                    Admin Panel
                  </Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
