import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar, AdminHeader } from "./dashboard";
import type { ProductWithColorVariants, ProductColorVariant } from "@shared/color-variants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Package, X, List, Image, Box, Wrench, ToggleLeft, ToggleRight, Upload, Link, Star, Palette, ArrowUp, ArrowDown } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const inputClass = "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring";

export default function AdminProducts() {
  const { data: products, isLoading } = useQuery<ProductWithColorVariants[]>({ queryKey: ["/api/products"] });
  const { toast } = useToast();
  const [editProduct, setEditProduct] = useState<ProductWithColorVariants | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", slug: "", shortDescription: "", longDescription: "",
    price: "", compareAtPrice: "", category: "Best Sellers", badge: "",
    image: "", stock: "100", isActive: true, isFeatured: false,
    features: [] as string[],
    specs: {} as Record<string, string>,
    whatsInBox: [] as string[],
    images: [] as string[],
    colorVariants: [] as ProductColorVariant[],
  });
  const [specEntries, setSpecEntries] = useState<{key: string, value: string}[]>([]);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const mainImageRef = useRef<HTMLInputElement>(null);
  const additionalImageRefs = useRef<Map<number, HTMLInputElement>>(new Map());
  const colorImageRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const setAdditionalImageRef = useCallback((index: number, el: HTMLInputElement | null) => {
    if (el) {
      additionalImageRefs.current.set(index, el);
    } else {
      additionalImageRefs.current.delete(index);
    }
  }, []);
  const setColorImageRef = useCallback((key: string, el: HTMLInputElement | null) => {
    if (el) {
      colorImageRefs.current.set(key, el);
    } else {
      colorImageRefs.current.delete(key);
    }
  }, []);

  const handleImageUpload = async (file: File, onSuccess: (url: string) => void) => {
    const formData = new FormData();
    formData.append("image", file);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }
      onSuccess(data.url);
    } catch (err: any) {
      clearTimeout(timeoutId);
      const msg = err instanceof Error ? err.message : "Could not upload image. Try again.";
      toast({ title: "Upload Failed", description: msg, variant: "destructive" });
    }
  };

  const productSaveTimeout =
    Number(import.meta.env.VITE_PRODUCT_SAVE_TIMEOUT_MS) || 90000;

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editProduct) {
        return apiRequest("PATCH", `/api/products/${editProduct.id}`, data, { timeout: productSaveTimeout });
      }
      return apiRequest("POST", "/api/products", data, { timeout: productSaveTimeout });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: editProduct ? "Product Updated" : "Product Created" });
      setShowForm(false);
      setEditProduct(null);
      resetForm();
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error ?? "");
      const isTimeout =
        /abort|timeout|failed to fetch|network error/i.test(msg) ||
        (error instanceof Error && error.name === "AbortError");
      const description = isTimeout
        ? "Request timed out. Check your connection and try again."
        : msg.replace(/^\d+:\s*/, "") || "Failed to save product";
      toast({ title: "Error", description, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product Deleted" });
    },
  });

  const resetForm = () => {
    setForm({
      name: "", slug: "", shortDescription: "", longDescription: "",
      price: "", compareAtPrice: "", category: "Best Sellers", badge: "",
      image: "", stock: "100", isActive: true, isFeatured: false,
      features: [], specs: {}, whatsInBox: [], images: [],
      colorVariants: [],
    });
    setSpecEntries([]);
  };

  const openEdit = (p: ProductWithColorVariants) => {
    setEditProduct(p);
    setForm({
      name: p.name, slug: p.slug,
      shortDescription: p.shortDescription, longDescription: p.longDescription,
      price: p.price, compareAtPrice: p.compareAtPrice || "",
      category: p.category, badge: p.badge || "",
      image: p.image, stock: String(p.stock),
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      features: p.features || [],
      specs: p.specs || {},
      whatsInBox: p.whatsInBox || [],
      images: p.images || [],
      colorVariants: p.colorVariants || [],
    });
    setSpecEntries(Object.entries(p.specs || {}).map(([key, value]) => ({ key, value })));
    saveMutation.reset();
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Error", description: "Product name is required.", variant: "destructive" });
      return;
    }
    if (!form.shortDescription.trim()) {
      toast({ title: "Error", description: "Short description is required.", variant: "destructive" });
      return;
    }
    if (!form.longDescription.trim()) {
      toast({ title: "Error", description: "Long description is required.", variant: "destructive" });
      return;
    }
    if (!form.image.trim()) {
      toast({ title: "Error", description: "Main image URL or upload is required.", variant: "destructive" });
      return;
    }
    if (!form.price.trim()) {
      toast({ title: "Error", description: "Price is required.", variant: "destructive" });
      return;
    }
    const stockNum = parseInt(form.stock);
    if (isNaN(stockNum) || stockNum < 0) {
      toast({ title: "Error", description: "Stock must be a valid number (0 or more).", variant: "destructive" });
      return;
    }
    const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    saveMutation.mutate({
      name: form.name,
      slug,
      shortDescription: form.shortDescription,
      longDescription: form.longDescription,
      price: form.price,
      compareAtPrice: form.compareAtPrice || null,
      category: form.category,
      badge: form.badge || null,
      image: form.image,
      stock: stockNum,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      features: form.features.filter(f => f.trim()),
      specs: Object.fromEntries(specEntries.filter(e => e.key.trim()).map(e => [e.key, e.value])),
      whatsInBox: form.whatsInBox.filter(w => w.trim()),
      images: form.images.filter(i => i.trim()),
      colorVariants: form.colorVariants
        .map((variant) => ({
          name: variant.name.trim(),
          swatch: variant.swatch.trim(),
          images: variant.images.map((image) => image.trim()).filter(Boolean),
        }))
        .filter((variant) => variant.name && variant.images.length > 0),
    });
  };

  return (
    <div className="flex h-screen w-full bg-section-alt overflow-hidden">
      <AdminSidebar active="/admin/products" />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader title="Products" />
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-foreground text-lg font-semibold" data-testid="text-product-count">{products?.length || 0} Products</h3>
            </div>
            <button
              onClick={() => { resetForm(); setEditProduct(null); saveMutation.reset(); setShowForm(true); }}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-foreground transition-colors"
              data-testid="button-add-product"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>

          <div className="bg-card border border-border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">Product</th>
                    <th className="p-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">Category</th>
                    <th className="p-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">Price</th>
                    <th className="p-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">Stock</th>
                    <th className="p-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">Status</th>
                    <th className="p-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">Featured</th>
                    <th className="p-4 text-muted-foreground text-xs font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {products?.map((product) => (
                    <tr key={product.id} className="hover:bg-white/[0.02] transition-colors" data-testid={`row-product-${product.id}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                          </div>
                          <div>
                            <p className="text-foreground text-sm font-medium">{product.name}</p>
                            <p className="text-muted-foreground text-xs">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">{product.category}</td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-foreground text-sm font-medium">${product.price}</span>
                          {product.compareAtPrice && (
                            <span className="text-muted-foreground text-xs line-through" data-testid={`text-compare-price-${product.id}`}>${product.compareAtPrice}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-sm font-medium ${product.stock < 20 ? "text-amber-400" : "text-emerald-400"}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${product.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={async () => {
                            await apiRequest("PATCH", `/api/products/${product.id}`, { isFeatured: !product.isFeatured });
                            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
                          }}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors"
                          data-testid={`button-toggle-featured-${product.id}`}
                        >
                          <Star className={`h-5 w-5 ${product.isFeatured ? "text-primary fill-primary" : "text-muted-foreground"}`} />
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(product)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" data-testid={`button-edit-${product.id}`}>
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteProductId(product.id)} className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors" data-testid={`button-delete-${product.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="bg-background border-border text-foreground max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">{editProduct ? "Edit Product" : "Add Product"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="flex items-center gap-2 pb-2">
                <Package className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Basic Info</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                  <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputClass} data-testid="input-product-name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Slug</label>
                  <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="Auto-generated from name if empty"
                    className={inputClass} data-testid="input-product-slug" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Short Description</label>
                <input type="text" required value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                  className={inputClass} data-testid="input-product-short-desc" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Long Description</label>
                <textarea required value={form.longDescription} onChange={(e) => setForm({ ...form, longDescription: e.target.value })} rows={3}
                  className={`${inputClass} resize-none`} data-testid="input-product-long-desc" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Main Image</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input type="text" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })}
                      placeholder="Paste image URL here"
                      className={`${inputClass} pl-9`} data-testid="input-product-image" />
                  </div>
                  <span className="text-muted-foreground text-xs">or</span>
                  <input type="file" ref={mainImageRef} accept="image/*" className="hidden" data-testid="file-main-image"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      try {
                        await handleImageUpload(file, (url) => setForm(prev => ({ ...prev, image: url })));
                      } finally {
                        setUploading(false);
                        e.target.value = "";
                      }
                    }} />
                  <Button type="button" variant="outline" size="sm" disabled={uploading}
                    onClick={() => mainImageRef.current?.click()}
                    className="bg-background text-muted-foreground"
                    data-testid="button-upload-main-image"
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
                {form.image && (
                  <div className="mt-2 h-20 w-20 rounded-md overflow-hidden bg-muted" data-testid="preview-main-image">
                    <img src={form.image} alt="Preview" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Price</label>
                  <input type="text" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className={inputClass} data-testid="input-product-price" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Compare At Price</label>
                  <input type="text" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
                    placeholder="Optional original price"
                    className={inputClass} data-testid="input-product-compare-price" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Stock</label>
                  <input type="number" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className={inputClass} data-testid="input-product-stock" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className={inputClass} data-testid="select-product-category">
                    <option value="Best Sellers">Best Sellers</option>
                    <option value="Portable">Portable</option>
                    <option value="Family">Family</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Badge</label>
                  <input type="text" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    className={inputClass} placeholder="e.g. Flagship, Best Seller" data-testid="input-product-badge" />
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <label className="text-sm font-medium text-foreground">Active</label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className="flex items-center gap-2 text-sm"
                  data-testid="button-toggle-active"
                >
                  {form.isActive ? (
                    <ToggleRight className="h-7 w-7 text-primary" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-muted-foreground" />
                  )}
                  <span className={form.isActive ? "text-emerald-400 font-medium" : "text-muted-foreground"}>
                    {form.isActive ? "Active" : "Inactive"}
                  </span>
                </button>
              </div>
              <div className="flex items-center justify-between py-2">
                <label className="text-sm font-medium text-foreground">Featured</label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isFeatured: !form.isFeatured })}
                  className="flex items-center gap-2 text-sm"
                  data-testid="button-toggle-featured"
                >
                  <Star className={`h-6 w-6 ${form.isFeatured ? "text-primary fill-primary" : "text-muted-foreground"}`} />
                  <span className={form.isFeatured ? "text-primary font-medium" : "text-muted-foreground"}>
                    {form.isFeatured ? "Featured" : "Not Featured"}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2 pt-4 pb-2 border-t border-border">
                <List className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Features</h3>
              </div>
              <div className="space-y-2">
                {form.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={feature}
                      onChange={(e) => {
                        const updated = [...form.features];
                        updated[i] = e.target.value;
                        setForm({ ...form, features: updated });
                      }}
                      className={`flex-1 ${inputClass}`}
                      placeholder="e.g. IPX7 waterproof"
                      data-testid={`input-feature-${i}`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = form.features.filter((_, idx) => idx !== i);
                        setForm({ ...form, features: updated });
                      }}
                      className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                      data-testid={`button-remove-feature-${i}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, features: [...form.features, ""] })}
                  className="flex items-center gap-1 text-primary text-sm hover:opacity-80"
                  data-testid="button-add-feature"
                >
                  <Plus className="h-4 w-4" /> Add Feature
                </button>
              </div>

              <div className="flex items-center gap-2 pt-4 pb-2 border-t border-border">
                <Wrench className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Specs</h3>
              </div>
              <div className="space-y-2">
                {specEntries.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={entry.key}
                      onChange={(e) => {
                        const updated = [...specEntries];
                        updated[i] = { ...updated[i], key: e.target.value };
                        setSpecEntries(updated);
                      }}
                      className={`flex-1 ${inputClass}`}
                      placeholder="Spec Name"
                      data-testid={`input-spec-key-${i}`}
                    />
                    <input
                      value={entry.value}
                      onChange={(e) => {
                        const updated = [...specEntries];
                        updated[i] = { ...updated[i], value: e.target.value };
                        setSpecEntries(updated);
                      }}
                      className={`flex-1 ${inputClass}`}
                      placeholder="Value"
                      data-testid={`input-spec-value-${i}`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = specEntries.filter((_, idx) => idx !== i);
                        setSpecEntries(updated);
                      }}
                      className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                      data-testid={`button-remove-spec-${i}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSpecEntries([...specEntries, { key: "", value: "" }])}
                  className="flex items-center gap-1 text-primary text-sm hover:opacity-80"
                  data-testid="button-add-spec"
                >
                  <Plus className="h-4 w-4" /> Add Spec
                </button>
              </div>

              <div className="flex items-center gap-2 pt-4 pb-2 border-t border-border">
                <Box className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">What's in the Box</h3>
              </div>
              <div className="space-y-2">
                {form.whatsInBox.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={item}
                      onChange={(e) => {
                        const updated = [...form.whatsInBox];
                        updated[i] = e.target.value;
                        setForm({ ...form, whatsInBox: updated });
                      }}
                      className={`flex-1 ${inputClass}`}
                      placeholder="e.g. 1x Water Flosser Unit"
                      data-testid={`input-whatsInBox-${i}`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = form.whatsInBox.filter((_, idx) => idx !== i);
                        setForm({ ...form, whatsInBox: updated });
                      }}
                      className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                      data-testid={`button-remove-whatsInBox-${i}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, whatsInBox: [...form.whatsInBox, ""] })}
                  className="flex items-center gap-1 text-primary text-sm hover:opacity-80"
                  data-testid="button-add-whatsInBox"
                >
                  <Plus className="h-4 w-4" /> Add Item
                </button>
              </div>

              <div className="flex items-center gap-2 pt-4 pb-2 border-t border-border">
                <Image className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Additional Images</h3>
              </div>
              <div className="space-y-2">
                {form.images.map((imgUrl, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={imgUrl}
                      onChange={(e) => {
                        const updated = [...form.images];
                        updated[i] = e.target.value;
                        setForm({ ...form, images: updated });
                      }}
                      className={`flex-1 ${inputClass}`}
                      placeholder="Paste URL or upload"
                      data-testid={`input-image-${i}`}
                    />
                    <input type="file" accept="image/*" className="hidden" data-testid={`file-image-${i}`}
                      ref={(el) => setAdditionalImageRef(i, el)}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingKey(`additional:${i}`);
                        try {
                          await handleImageUpload(file, (url) => {
                            setForm(prev => {
                              const updated = [...prev.images];
                              updated[i] = url;
                              return { ...prev, images: updated };
                            });
                          });
                        } finally {
                          setUploadingKey(null);
                          e.target.value = "";
                        }
                      }} />
                    <Button type="button" variant="outline" size="icon" disabled={uploadingKey === `additional:${i}`}
                      onClick={() => additionalImageRefs.current.get(i)?.click()}
                      className="bg-background text-muted-foreground"
                      data-testid={`button-upload-image-${i}`}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    {imgUrl && (
                      <div className="h-9 w-9 rounded-md overflow-hidden bg-muted flex-shrink-0" data-testid={`preview-image-${i}`}>
                        <img src={imgUrl} alt="Preview" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = form.images.filter((_, idx) => idx !== i);
                        setForm({ ...form, images: updated });
                      }}
                      className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                      data-testid={`button-remove-image-${i}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, images: [...form.images, ""] })}
                  className="flex items-center gap-1 text-primary text-sm hover:opacity-80"
                  data-testid="button-add-image"
                >
                  <Plus className="h-4 w-4" /> Add Image
                </button>
              </div>

              <div className="flex items-center gap-2 pt-4 pb-2 border-t border-border">
                <Palette className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Color Variants (with images)</h3>
              </div>
              <div className="space-y-4">
                {form.colorVariants.map((variant, variantIndex) => (
                  <div key={variantIndex} className="rounded-md border border-border p-3 bg-background/30 space-y-3" data-testid={`variant-${variantIndex}`}>
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 items-end">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Color Name</label>
                        <input
                          value={variant.name}
                          onChange={(e) => {
                            const updated = [...form.colorVariants];
                            updated[variantIndex] = { ...updated[variantIndex], name: e.target.value };
                            setForm({ ...form, colorVariants: updated });
                          }}
                          className={inputClass}
                          placeholder="e.g. White / Midnight Black"
                          data-testid={`input-variant-name-${variantIndex}`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Swatch</label>
                        <input
                          type="color"
                          value={variant.swatch || "#272c40"}
                          onChange={(e) => {
                            const updated = [...form.colorVariants];
                            updated[variantIndex] = { ...updated[variantIndex], swatch: e.target.value };
                            setForm({ ...form, colorVariants: updated });
                          }}
                          className="h-10 w-14 rounded border border-border bg-background p-1"
                          data-testid={`input-variant-swatch-${variantIndex}`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = form.colorVariants.filter((_, idx) => idx !== variantIndex);
                          setForm({ ...form, colorVariants: updated });
                        }}
                        className="rounded-md border border-border px-3 h-10 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        data-testid={`button-remove-variant-${variantIndex}`}
                      >
                        Remove Color
                      </button>
                    </div>

                    <div className="space-y-2">
                      {variant.images.map((variantImage, imageIndex) => {
                        const refKey = `${variantIndex}:${imageIndex}`;
                        return (
                          <div key={imageIndex} className="flex items-center gap-2">
                            <input
                              value={variantImage}
                              onChange={(e) => {
                                const updated = [...form.colorVariants];
                                const images = [...updated[variantIndex].images];
                                images[imageIndex] = e.target.value;
                                updated[variantIndex] = { ...updated[variantIndex], images };
                                setForm({ ...form, colorVariants: updated });
                              }}
                              className={`flex-1 ${inputClass}`}
                              placeholder="Color specific image URL"
                              data-testid={`input-variant-image-${variantIndex}-${imageIndex}`}
                            />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              ref={(el) => setColorImageRef(refKey, el)}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setUploadingKey(`variant:${variantIndex}:${imageIndex}`);
                                try {
                                  await handleImageUpload(file, (url) => {
                                    setForm((prev) => {
                                      const updated = [...prev.colorVariants];
                                      const images = [...updated[variantIndex].images];
                                      images[imageIndex] = url;
                                      updated[variantIndex] = { ...updated[variantIndex], images };
                                      return { ...prev, colorVariants: updated };
                                    });
                                  });
                                } finally {
                                  setUploadingKey(null);
                                  e.target.value = "";
                                }
                              }}
                              data-testid={`file-variant-image-${variantIndex}-${imageIndex}`}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              disabled={uploadingKey === `variant:${variantIndex}:${imageIndex}`}
                              onClick={() => colorImageRefs.current.get(refKey)?.click()}
                              className="bg-background text-muted-foreground"
                              data-testid={`button-upload-variant-image-${variantIndex}-${imageIndex}`}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                if (imageIndex === 0) return;
                                const updated = [...form.colorVariants];
                                const images = [...updated[variantIndex].images];
                                [images[imageIndex - 1], images[imageIndex]] = [images[imageIndex], images[imageIndex - 1]];
                                updated[variantIndex] = { ...updated[variantIndex], images };
                                setForm({ ...form, colorVariants: updated });
                              }}
                              disabled={imageIndex === 0}
                              className="bg-background text-muted-foreground"
                              data-testid={`button-variant-image-up-${variantIndex}-${imageIndex}`}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                if (imageIndex === variant.images.length - 1) return;
                                const updated = [...form.colorVariants];
                                const images = [...updated[variantIndex].images];
                                [images[imageIndex + 1], images[imageIndex]] = [images[imageIndex], images[imageIndex + 1]];
                                updated[variantIndex] = { ...updated[variantIndex], images };
                                setForm({ ...form, colorVariants: updated });
                              }}
                              disabled={imageIndex === variant.images.length - 1}
                              className="bg-background text-muted-foreground"
                              data-testid={`button-variant-image-down-${variantIndex}-${imageIndex}`}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...form.colorVariants];
                                const images = updated[variantIndex].images.filter((_, idx) => idx !== imageIndex);
                                updated[variantIndex] = { ...updated[variantIndex], images };
                                setForm({ ...form, colorVariants: updated });
                              }}
                              className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                              data-testid={`button-remove-variant-image-${variantIndex}-${imageIndex}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...form.colorVariants];
                          updated[variantIndex] = { ...updated[variantIndex], images: [...updated[variantIndex].images, ""] };
                          setForm({ ...form, colorVariants: updated });
                        }}
                        className="flex items-center gap-1 text-primary text-sm hover:opacity-80"
                        data-testid={`button-add-variant-image-${variantIndex}`}
                      >
                        <Plus className="h-4 w-4" /> Add Color Image
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      ...form,
                      colorVariants: [...form.colorVariants, { name: "", swatch: "#272c40", images: [""] }],
                    });
                  }}
                  className="flex items-center gap-1 text-primary text-sm hover:opacity-80"
                  data-testid="button-add-color-variant"
                >
                  <Plus className="h-4 w-4" /> Add Color Variant
                </button>
              </div>

              {saveMutation.error && (
                <p className="text-sm text-red-500 mt-2" data-testid="product-save-error">
                  {saveMutation.error instanceof Error ? saveMutation.error.message.replace(/^\d+:\s*/, "") : String(saveMutation.error)}
                </p>
              )}
              <div className="flex gap-3 pt-4 border-t border-border">
                <button type="submit" disabled={saveMutation.isPending}
                  className="flex-1 rounded-md bg-primary py-2.5 text-sm font-bold text-foreground disabled:opacity-50 transition-colors"
                  data-testid="button-save-product">
                  {saveMutation.isPending ? "Saving..." : "Save Product"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-6 rounded-md border border-border py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-cancel-product">
                  Cancel
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteProductId !== null} onOpenChange={(open) => { if (!open) setDeleteProductId(null); }}>
          <AlertDialogContent className="bg-background border-border text-foreground" data-testid="dialog-delete-confirm">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This action cannot be undone. The product will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border text-muted-foreground hover:text-foreground hover:bg-muted/50" data-testid="button-cancel-delete">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-600 hover:bg-red-700 text-foreground"
                onClick={() => {
                  if (deleteProductId !== null) {
                    deleteMutation.mutate(deleteProductId);
                    setDeleteProductId(null);
                  }
                }}
                data-testid="button-confirm-delete"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
