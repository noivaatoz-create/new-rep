import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Navigation } from "@/components/navigation";
import { CartDrawer } from "@/components/cart-drawer";
import { Footer } from "@/components/footer";
import HomePage from "@/pages/home";
import ShopPage from "@/pages/shop";
import ProductDetailPage from "@/pages/product-detail";
import CheckoutPage from "@/pages/checkout";
import AboutPage from "@/pages/about";
import ContactPage from "@/pages/contact";
import FAQPage from "@/pages/faq";
import ReviewsPage from "@/pages/reviews";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import TermsPage from "@/pages/terms";
import ShippingReturnsPage from "@/pages/shipping-returns";
import TrackOrderPage from "@/pages/track-order";
import SuccessPage from "@/pages/success";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminProducts from "@/pages/admin/products";
import AdminOrders from "@/pages/admin/orders";
import AdminSettings from "@/pages/admin/settings";
import AdminMessages from "@/pages/admin/messages";
import AdminGallery from "@/pages/admin/gallery";
import AdminNewsletter from "@/pages/admin/newsletter";
import AdminLogin from "@/pages/admin/login";
import { AdminGuard } from "@/lib/admin-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";

function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />
      <CartDrawer />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function Router() {
  return (
    <ErrorBoundary>
    <Switch>
      <Route path="/">
        {() => <CustomerLayout><HomePage /></CustomerLayout>}
      </Route>
      <Route path="/shop">
        {() => <CustomerLayout><ShopPage /></CustomerLayout>}
      </Route>
      <Route path="/product/:slug">
        {() => <CustomerLayout><ProductDetailPage /></CustomerLayout>}
      </Route>
      <Route path="/checkout">
        {() => <CustomerLayout><CheckoutPage /></CustomerLayout>}
      </Route>
      <Route path="/checkout/success">
        {() => <CustomerLayout><SuccessPage /></CustomerLayout>}
      </Route>
      <Route path="/about">
        {() => <CustomerLayout><AboutPage /></CustomerLayout>}
      </Route>
      <Route path="/contact">
        {() => <CustomerLayout><ContactPage /></CustomerLayout>}
      </Route>
      <Route path="/faq">
        {() => <CustomerLayout><FAQPage /></CustomerLayout>}
      </Route>
      <Route path="/reviews">
        {() => <CustomerLayout><ReviewsPage /></CustomerLayout>}
      </Route>
      <Route path="/privacy-policy">
        {() => <CustomerLayout><PrivacyPolicyPage /></CustomerLayout>}
      </Route>
      <Route path="/terms">
        {() => <CustomerLayout><TermsPage /></CustomerLayout>}
      </Route>
      <Route path="/shipping-returns">
        {() => <CustomerLayout><ShippingReturnsPage /></CustomerLayout>}
      </Route>
      <Route path="/track-order">
        {() => <CustomerLayout><TrackOrderPage /></CustomerLayout>}
      </Route>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/nv-c4f7" component={AdminLogin} />
      <Route path="/admin">
        {() => <AdminGuard><AdminDashboard /></AdminGuard>}
      </Route>
      <Route path="/admin/products">
        {() => <AdminGuard><AdminProducts /></AdminGuard>}
      </Route>
      <Route path="/admin/orders">
        {() => <AdminGuard><AdminOrders /></AdminGuard>}
      </Route>
      <Route path="/admin/gallery">
        {() => <AdminGuard><AdminGallery /></AdminGuard>}
      </Route>
      <Route path="/admin/settings">
        {() => <AdminGuard><AdminSettings /></AdminGuard>}
      </Route>
      <Route path="/admin/messages">
        {() => <AdminGuard><AdminMessages /></AdminGuard>}
      </Route>
      <Route path="/admin/newsletter">
        {() => <AdminGuard><AdminNewsletter /></AdminGuard>}
      </Route>
      <Route>
        {() => <CustomerLayout><NotFound /></CustomerLayout>}
      </Route>
    </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
