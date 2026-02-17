import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useCartStore } from "@/lib/cart-store";
import { useState } from "react";
import type { Product } from "@shared/schema";
import { Search } from "lucide-react";

export default function ShopPage() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    staleTime: 0,
    refetchOnMount: "always",
  });
  const { addItem } = useCartStore();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const categories = ["all", "Best Sellers", "Portable", "Family", "Accessories"];

  const filtered = products?.filter((p) => {
    const matchCat = category === "all" || p.category === category;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.shortDescription.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase mb-3">Collection</p>
          <h1 className="text-3xl sm:text-4xl font-serif text-foreground mb-3" data-testid="text-shop-title">Shop All Products</h1>
          <p className="text-muted-foreground leading-relaxed">Premium water flossers crafted for the modern ritual.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-full border border-border bg-card pl-11 pr-5 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 text-sm"
              data-testid="input-search"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  category === cat
                    ? "bg-foreground text-background"
                    : "bg-card text-muted-foreground border border-border hover:border-foreground/20 hover:text-foreground"
                }`}
                data-testid={`button-filter-${cat.toLowerCase().replace(/\s/g, "-")}`}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                <div className="aspect-[4/5] bg-muted animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                  <div className="h-3 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <p className="text-muted-foreground text-sm mb-8" data-testid="text-product-count">
              {filtered?.length || 0} product{(filtered?.length || 0) !== 1 ? "s" : ""} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered?.map((product) => (
                <div key={product.id} className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:shadow-lg hover:border-primary/20 group" data-testid={`card-product-${product.id}`}>
                  <Link href={`/product/${product.slug}`}>
                    <div className="relative aspect-[4/5] w-full bg-muted overflow-hidden cursor-pointer">
                      <img
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        src={product.image}
                      />
                      {product.badge && (
                        <div className="absolute top-4 left-4 rounded-full px-3 py-1 text-[10px] font-medium tracking-wider uppercase bg-background/90 backdrop-blur text-foreground border border-border/50">
                          {product.badge}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex justify-between items-start mb-2 gap-2 flex-wrap">
                      <h3 className="text-base font-medium text-foreground">{product.name}</h3>
                      <div className="flex items-center gap-2">
                        {product.compareAtPrice && (
                          <span className="text-muted-foreground text-sm line-through">${product.compareAtPrice}</span>
                        )}
                        <span className="text-foreground font-medium">${product.price}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 flex-1 leading-relaxed">{product.shortDescription}</p>
                    <p className="text-xs text-muted-foreground/60 mb-5 tracking-wider uppercase">{product.category}</p>
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
          </>
        )}
      </div>
    </div>
  );
}
