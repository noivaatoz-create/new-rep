import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar, AdminHeader } from "./dashboard";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Save, CreditCard, Store, Mail, Layout, Eye, EyeOff, Type, Share2 } from "lucide-react";
import { SiStripe, SiPaypal, SiFacebook, SiInstagram, SiX, SiYoutube, SiTiktok, SiLinkedin } from "react-icons/si";

interface SettingsForm {
  stripeEnabled: string;
  stripePublicKey: string;
  stripeSecretKey: string;
  paypalEnabled: string;
  paypalEmail: string;
  paypalClientId: string;
  paypalClientSecret: string;
  paypalMode: string;
  codEnabled: string;
  storeName: string;
  currency: string;
  taxRate: string;
  freeShippingThreshold: string;
  shippingFlatRate: string;
  orderPrefix: string;
  supportEmail: string;
  supportPhone: string;
  storeAddress: string;
  logoText: string;
  showLogoIcon: string;
  logoSize: string;
  showNavShop: string;
  showNavAbout: string;
  showNavFaq: string;
  showNavContact: string;
  showNavReviews: string;
  showFooterNewsletter: string;
  showFooterSocial: string;
  showFooterLinks: string;
  copyrightText: string;
  heroFallbackImage: string;
  socialFacebook: string;
  socialInstagram: string;
  socialTwitter: string;
  socialYoutube: string;
  socialTiktok: string;
  socialLinkedin: string;
}

const defaultForm: SettingsForm = {
  stripeEnabled: "false",
  stripePublicKey: "",
  stripeSecretKey: "",
  paypalEnabled: "false",
  paypalEmail: "",
  paypalClientId: "",
  paypalClientSecret: "",
  paypalMode: "sandbox",
  codEnabled: "false",
  storeName: "",
  currency: "USD",
  taxRate: "0",
  freeShippingThreshold: "0",
  shippingFlatRate: "0",
  orderPrefix: "",
  supportEmail: "",
  supportPhone: "",
  storeAddress: "",
  logoText: "NOVAATOZ",
  showLogoIcon: "true",
  logoSize: "default",
  showNavShop: "true",
  showNavAbout: "true",
  showNavFaq: "true",
  showNavContact: "true",
  showNavReviews: "true",
  showFooterNewsletter: "true",
  showFooterSocial: "true",
  showFooterLinks: "true",
  copyrightText: "",
  heroFallbackImage: "",
  socialFacebook: "",
  socialInstagram: "",
  socialTwitter: "",
  socialYoutube: "",
  socialTiktok: "",
  socialLinkedin: "",
};

function Toggle({ value, onToggle, testId }: { value: string; onToggle: () => void; testId: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        value === "true" ? "bg-primary" : "bg-muted"
      }`}
      data-testid={testId}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        value === "true" ? "translate-x-6" : "translate-x-1"
      }`} />
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card border border-border rounded-md p-6 space-y-4">
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          <div className="space-y-3">
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
            <div className="h-10 w-2/3 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [form, setForm] = useState<SettingsForm>(defaultForm);

  const { data: settings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (settings) {
      setForm({
        stripeEnabled: settings.stripeEnabled || "false",
        stripePublicKey: settings.stripePublicKey || "",
        stripeSecretKey: settings.stripeSecretKey || "",
        paypalEnabled: settings.paypalEnabled || "false",
        paypalEmail: settings.paypalEmail || "",
        paypalClientId: settings.paypalClientId || "",
        paypalClientSecret: settings.paypalClientSecret || "",
        paypalMode: settings.paypalMode || "sandbox",
        codEnabled: settings.codEnabled || "false",
        storeName: settings.storeName || "",
        currency: settings.currency || "USD",
        taxRate: settings.taxRate ? String(parseFloat(settings.taxRate) * 100) : "0",
        freeShippingThreshold: settings.freeShippingThreshold || "0",
        shippingFlatRate: settings.shippingFlatRate || "0",
        orderPrefix: settings.orderPrefix || "",
        supportEmail: settings.supportEmail || "",
        supportPhone: settings.supportPhone || "",
        storeAddress: settings.storeAddress || "",
        logoText: settings.logoText || "NOVAATOZ",
        showLogoIcon: settings.showLogoIcon || "true",
        logoSize: settings.logoSize || "default",
        showNavShop: settings.showNavShop || "true",
        showNavAbout: settings.showNavAbout || "true",
        showNavFaq: settings.showNavFaq || "true",
        showNavContact: settings.showNavContact || "true",
        showNavReviews: settings.showNavReviews || "true",
        showFooterNewsletter: settings.showFooterNewsletter || "true",
        showFooterSocial: settings.showFooterSocial || "true",
        showFooterLinks: settings.showFooterLinks || "true",
        copyrightText: settings.copyrightText || "",
        heroFallbackImage: settings.heroFallbackImage || "",
        socialFacebook: settings.socialFacebook || "",
        socialInstagram: settings.socialInstagram || "",
        socialTwitter: settings.socialTwitter || "",
        socialYoutube: settings.socialYoutube || "",
        socialTiktok: settings.socialTiktok || "",
        socialLinkedin: settings.socialLinkedin || "",
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      return apiRequest("PATCH", "/api/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/paypal/config"] });
      toast({ title: "Settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    },
  });

  const savePayment = () => {
    saveMutation.mutate({
      stripeEnabled: form.stripeEnabled,
      stripePublicKey: form.stripePublicKey,
      stripeSecretKey: form.stripeSecretKey,
      paypalEnabled: form.paypalEnabled,
      paypalEmail: form.paypalEmail,
      paypalClientId: form.paypalClientId,
      paypalClientSecret: form.paypalClientSecret,
      paypalMode: form.paypalMode,
      codEnabled: form.codEnabled,
    });
  };

  const saveStore = () => {
    saveMutation.mutate({
      storeName: form.storeName,
      currency: form.currency,
      taxRate: String(parseFloat(form.taxRate) / 100),
      freeShippingThreshold: form.freeShippingThreshold,
      shippingFlatRate: form.shippingFlatRate,
      orderPrefix: form.orderPrefix,
    });
  };

  const saveAppearance = () => {
    saveMutation.mutate({
      logoText: form.logoText,
      showLogoIcon: form.showLogoIcon,
      logoSize: form.logoSize,
      showNavShop: form.showNavShop,
      showNavAbout: form.showNavAbout,
      showNavFaq: form.showNavFaq,
      showNavContact: form.showNavContact,
      showNavReviews: form.showNavReviews,
      showFooterNewsletter: form.showFooterNewsletter,
      showFooterSocial: form.showFooterSocial,
      showFooterLinks: form.showFooterLinks,
      copyrightText: form.copyrightText,
      heroFallbackImage: form.heroFallbackImage,
      socialFacebook: form.socialFacebook,
      socialInstagram: form.socialInstagram,
      socialTwitter: form.socialTwitter,
      socialYoutube: form.socialYoutube,
      socialTiktok: form.socialTiktok,
      socialLinkedin: form.socialLinkedin,
    });
  };

  const saveContact = () => {
    saveMutation.mutate({
      supportEmail: form.supportEmail,
      supportPhone: form.supportPhone,
      storeAddress: form.storeAddress,
    });
  };

  const inputClass = "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder-muted-foreground";
  const labelClass = "block text-sm font-medium text-muted-foreground mb-1.5";

  return (
    <div className="flex h-screen w-full bg-section-alt overflow-hidden">
      <AdminSidebar active="/admin/settings" />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader title="Settings" />
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <>
              <div className="bg-card border border-border rounded-md p-6" data-testid="card-payment-settings">
                <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <h3 className="text-foreground text-base font-semibold">Payment Settings</h3>
                  </div>
                  <button
                    onClick={savePayment}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-foreground transition-colors disabled:opacity-50"
                    data-testid="button-save-payment"
                  >
                    <Save className="h-4 w-4" />
                    {saveMutation.isPending ? "Saving..." : "Save"}
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-4 p-3 rounded-md bg-background border border-border">
                    <div className="flex items-center gap-3">
                      <SiStripe className="h-5 w-5 text-[#635BFF]" />
                      <div>
                        <p className="text-foreground text-sm font-medium">Stripe</p>
                        <p className="text-muted-foreground text-xs">Accept credit card payments</p>
                      </div>
                    </div>
                    <Toggle
                      value={form.stripeEnabled}
                      onToggle={() => setForm({ ...form, stripeEnabled: form.stripeEnabled === "true" ? "false" : "true" })}
                      testId="toggle-stripe-enabled"
                    />
                  </div>

                  {form.stripeEnabled === "true" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-border ml-2">
                      <div>
                        <label className={labelClass}>Stripe Public Key</label>
                        <input
                          type="text"
                          value={form.stripePublicKey}
                          onChange={(e) => setForm({ ...form, stripePublicKey: e.target.value })}
                          className={inputClass}
                          placeholder="pk_live_..."
                          data-testid="input-stripe-public-key"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Stripe Secret Key</label>
                        <input
                          type="password"
                          value={form.stripeSecretKey}
                          onChange={(e) => setForm({ ...form, stripeSecretKey: e.target.value })}
                          className={inputClass}
                          placeholder="sk_live_..."
                          data-testid="input-stripe-secret-key"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-4 p-3 rounded-md bg-background border border-border">
                    <div className="flex items-center gap-3">
                      <SiPaypal className="h-5 w-5 text-[#00457C]" />
                      <div>
                        <p className="text-foreground text-sm font-medium">PayPal</p>
                        <p className="text-muted-foreground text-xs">Accept PayPal payments</p>
                      </div>
                    </div>
                    <Toggle
                      value={form.paypalEnabled}
                      onToggle={() => setForm({ ...form, paypalEnabled: form.paypalEnabled === "true" ? "false" : "true" })}
                      testId="toggle-paypal-enabled"
                    />
                  </div>

                  {form.paypalEnabled === "true" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-border ml-2">
                      <div>
                        <label className={labelClass}>PayPal Email</label>
                        <input
                          type="email"
                          value={form.paypalEmail}
                          onChange={(e) => setForm({ ...form, paypalEmail: e.target.value })}
                          className={inputClass}
                          placeholder="payments@example.com"
                          data-testid="input-paypal-email"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>PayPal Mode</label>
                        <select
                          value={form.paypalMode}
                          onChange={(e) => setForm({ ...form, paypalMode: e.target.value })}
                          className={inputClass}
                          data-testid="select-paypal-mode"
                        >
                          <option value="sandbox">Sandbox (Testing)</option>
                          <option value="live">Live (Production)</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>PayPal Client ID</label>
                        <input
                          type="text"
                          value={form.paypalClientId}
                          onChange={(e) => setForm({ ...form, paypalClientId: e.target.value })}
                          className={inputClass}
                          placeholder="AZx..."
                          data-testid="input-paypal-client-id"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>PayPal Client Secret</label>
                        <input
                          type="password"
                          value={form.paypalClientSecret}
                          onChange={(e) => setForm({ ...form, paypalClientSecret: e.target.value })}
                          className={inputClass}
                          placeholder="EJ..."
                          data-testid="input-paypal-client-secret"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-4 p-3 rounded-md bg-background border border-border">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-emerald-400" />
                      <div>
                        <p className="text-foreground text-sm font-medium">Cash on Delivery</p>
                        <p className="text-muted-foreground text-xs">Allow payment upon delivery</p>
                      </div>
                    </div>
                    <Toggle
                      value={form.codEnabled}
                      onToggle={() => setForm({ ...form, codEnabled: form.codEnabled === "true" ? "false" : "true" })}
                      testId="toggle-cod-enabled"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-md p-6" data-testid="card-store-settings">
                <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Store className="h-5 w-5 text-primary" />
                    <h3 className="text-foreground text-base font-semibold">Store Settings</h3>
                  </div>
                  <button
                    onClick={saveStore}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-foreground transition-colors disabled:opacity-50"
                    data-testid="button-save-store"
                  >
                    <Save className="h-4 w-4" />
                    {saveMutation.isPending ? "Saving..." : "Save"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Store Name</label>
                    <input
                      type="text"
                      value={form.storeName}
                      onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                      className={inputClass}
                      placeholder="My Store"
                      data-testid="input-store-name"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Currency</label>
                    <select
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                      className={inputClass}
                      data-testid="select-currency"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="INR">INR - Indian Rupee</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Tax Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.taxRate}
                      onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                      className={inputClass}
                      placeholder="8"
                      data-testid="input-tax-rate"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Free Shipping Threshold ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.freeShippingThreshold}
                      onChange={(e) => setForm({ ...form, freeShippingThreshold: e.target.value })}
                      className={inputClass}
                      placeholder="50"
                      data-testid="input-free-shipping-threshold"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Flat Rate Shipping ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.shippingFlatRate}
                      onChange={(e) => setForm({ ...form, shippingFlatRate: e.target.value })}
                      className={inputClass}
                      placeholder="5.99"
                      data-testid="input-shipping-flat-rate"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Order Number Prefix</label>
                    <input
                      type="text"
                      value={form.orderPrefix}
                      onChange={(e) => setForm({ ...form, orderPrefix: e.target.value })}
                      className={inputClass}
                      placeholder="ORD-"
                      data-testid="input-order-prefix"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-md p-6" data-testid="card-contact-settings">
                <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <h3 className="text-foreground text-base font-semibold">Contact Information</h3>
                  </div>
                  <button
                    onClick={saveContact}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-foreground transition-colors disabled:opacity-50"
                    data-testid="button-save-contact"
                  >
                    <Save className="h-4 w-4" />
                    {saveMutation.isPending ? "Saving..." : "Save"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Support Email</label>
                    <input
                      type="email"
                      value={form.supportEmail}
                      onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
                      className={inputClass}
                      placeholder="support@example.com"
                      data-testid="input-support-email"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Support Phone</label>
                    <input
                      type="tel"
                      value={form.supportPhone}
                      onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
                      className={inputClass}
                      placeholder="+1 (555) 123-4567"
                      data-testid="input-support-phone"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Store Address</label>
                    <textarea
                      value={form.storeAddress}
                      onChange={(e) => setForm({ ...form, storeAddress: e.target.value })}
                      rows={3}
                      className={`${inputClass} resize-none`}
                      placeholder="123 Main St, City, State, ZIP"
                      data-testid="input-store-address"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-md p-6" data-testid="card-appearance-settings">
                <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Layout className="h-5 w-5 text-primary" />
                    <h3 className="text-foreground text-base font-semibold">Header & Footer</h3>
                  </div>
                  <button
                    onClick={saveAppearance}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-foreground transition-colors disabled:opacity-50"
                    data-testid="button-save-appearance"
                  >
                    <Save className="h-4 w-4" />
                    {saveMutation.isPending ? "Saving..." : "Save"}
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-foreground text-sm font-medium mb-3 flex items-center gap-2">
                      <Type className="h-4 w-4 text-primary" />
                      Logo
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className={labelClass}>Logo Text</label>
                        <input
                          type="text"
                          value={form.logoText}
                          onChange={(e) => setForm({ ...form, logoText: e.target.value })}
                          className={inputClass}
                          placeholder="NOVAATOZ"
                          data-testid="input-logo-text"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Logo Size</label>
                        <select
                          value={form.logoSize}
                          onChange={(e) => setForm({ ...form, logoSize: e.target.value })}
                          className={inputClass}
                          data-testid="select-logo-size"
                        >
                          <option value="small">Small</option>
                          <option value="default">Default</option>
                          <option value="large">Large</option>
                        </select>
                      </div>
                      <div className="flex items-end gap-3 pb-0.5">
                        <div className="flex items-center gap-3">
                          <label className="text-sm font-medium text-muted-foreground">Show Logo Icon</label>
                          <Toggle
                            value={form.showLogoIcon}
                            onToggle={() => setForm({ ...form, showLogoIcon: form.showLogoIcon === "true" ? "false" : "true" })}
                            testId="toggle-logo-icon"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-foreground text-sm font-medium mb-3">Navigation Links</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[
                        { key: "showNavShop", label: "Shop" },
                        { key: "showNavAbout", label: "About" },
                        { key: "showNavFaq", label: "FAQ" },
                        { key: "showNavContact", label: "Contact" },
                        { key: "showNavReviews", label: "Reviews" },
                      ].map(nav => (
                        <div key={nav.key} className="flex items-center justify-between gap-2 p-3 rounded-md bg-background border border-border">
                          <span className="text-foreground text-sm">{nav.label}</span>
                          <Toggle
                            value={(form as any)[nav.key]}
                            onToggle={() => setForm({ ...form, [nav.key]: (form as any)[nav.key] === "true" ? "false" : "true" })}
                            testId={`toggle-nav-${nav.label.toLowerCase()}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-foreground text-sm font-medium mb-3">Footer Sections</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      {[
                        { key: "showFooterNewsletter", label: "Newsletter" },
                        { key: "showFooterSocial", label: "Social Links" },
                        { key: "showFooterLinks", label: "Footer Links" },
                      ].map(sec => (
                        <div key={sec.key} className="flex items-center justify-between gap-2 p-3 rounded-md bg-background border border-border">
                          <span className="text-foreground text-sm">{sec.label}</span>
                          <Toggle
                            value={(form as any)[sec.key]}
                            onToggle={() => setForm({ ...form, [sec.key]: (form as any)[sec.key] === "true" ? "false" : "true" })}
                            testId={`toggle-footer-${sec.label.toLowerCase().replace(/\s/g, '-')}`}
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className={labelClass}>Copyright Text</label>
                      <input
                        type="text"
                        value={form.copyrightText}
                        onChange={(e) => setForm({ ...form, copyrightText: e.target.value })}
                        className={inputClass}
                        placeholder="© 2025 Novaatoz Inc. All rights reserved."
                        data-testid="input-copyright-text"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Hero fallback image URL</label>
                      <input
                        type="url"
                        value={form.heroFallbackImage}
                        onChange={(e) => setForm({ ...form, heroFallbackImage: e.target.value })}
                        className={inputClass}
                        placeholder="/images/hero-product.png ya full URL"
                        data-testid="input-hero-fallback-image"
                      />
                      <p className="text-muted-foreground text-xs mt-1">Jab hero pe koi product nahi ya fallback dikhe, ye image use hogi.</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-foreground text-sm font-medium mb-3 flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-primary" />
                      Social Media Links
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>
                          <span className="flex items-center gap-1.5">
                            <SiFacebook className="h-3.5 w-3.5 text-[#1877F2]" />
                            Facebook URL
                          </span>
                        </label>
                        <input
                          type="url"
                          value={form.socialFacebook}
                          onChange={(e) => setForm({ ...form, socialFacebook: e.target.value })}
                          className={inputClass}
                          placeholder="https://facebook.com/yourpage"
                          data-testid="input-social-facebook"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          <span className="flex items-center gap-1.5">
                            <SiInstagram className="h-3.5 w-3.5 text-[#E4405F]" />
                            Instagram URL
                          </span>
                        </label>
                        <input
                          type="url"
                          value={form.socialInstagram}
                          onChange={(e) => setForm({ ...form, socialInstagram: e.target.value })}
                          className={inputClass}
                          placeholder="https://instagram.com/yourhandle"
                          data-testid="input-social-instagram"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          <span className="flex items-center gap-1.5">
                            <SiX className="h-3.5 w-3.5 text-foreground" />
                            X / Twitter URL
                          </span>
                        </label>
                        <input
                          type="url"
                          value={form.socialTwitter}
                          onChange={(e) => setForm({ ...form, socialTwitter: e.target.value })}
                          className={inputClass}
                          placeholder="https://x.com/yourhandle"
                          data-testid="input-social-twitter"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          <span className="flex items-center gap-1.5">
                            <SiYoutube className="h-3.5 w-3.5 text-[#FF0000]" />
                            YouTube URL
                          </span>
                        </label>
                        <input
                          type="url"
                          value={form.socialYoutube}
                          onChange={(e) => setForm({ ...form, socialYoutube: e.target.value })}
                          className={inputClass}
                          placeholder="https://youtube.com/@yourchannel"
                          data-testid="input-social-youtube"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          <span className="flex items-center gap-1.5">
                            <SiTiktok className="h-3.5 w-3.5 text-foreground" />
                            TikTok URL
                          </span>
                        </label>
                        <input
                          type="url"
                          value={form.socialTiktok}
                          onChange={(e) => setForm({ ...form, socialTiktok: e.target.value })}
                          className={inputClass}
                          placeholder="https://tiktok.com/@yourhandle"
                          data-testid="input-social-tiktok"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          <span className="flex items-center gap-1.5">
                            <SiLinkedin className="h-3.5 w-3.5 text-[#0A66C2]" />
                            LinkedIn URL
                          </span>
                        </label>
                        <input
                          type="url"
                          value={form.socialLinkedin}
                          onChange={(e) => setForm({ ...form, socialLinkedin: e.target.value })}
                          className={inputClass}
                          placeholder="https://linkedin.com/company/yourcompany"
                          data-testid="input-social-linkedin"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
