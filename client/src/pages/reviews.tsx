import { useQuery } from "@tanstack/react-query";
import type { Review } from "@shared/schema";

export default function ReviewsPage() {
  const { data: reviews, isLoading } = useQuery<Review[]>({ queryKey: ["/api/reviews"] });

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews?.filter((r) => r.rating === star).length || 0,
    pct: reviews && reviews.length > 0
      ? ((reviews.filter((r) => r.rating === star).length / reviews.length) * 100)
      : 0,
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-primary text-sm font-bold tracking-widest uppercase mb-4">Testimonials</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6" data-testid="text-reviews-title">Customer Reviews</h1>
          <p className="text-muted-foreground text-lg">See what our customers are saying about their Novaatoz experience.</p>
        </div>

        {!isLoading && reviews && reviews.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-12 mb-16">
            <div className="text-center p-8 rounded-md border border-border bg-card" data-testid="text-avg-rating">
              <p className="text-6xl font-bold text-foreground mb-2">{avgRating.toFixed(1)}</p>
              <div className="flex gap-1 justify-center mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className={`h-5 w-5 ${i < Math.round(avgRating) ? "text-amber-400" : "text-border"}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-muted-foreground text-sm">Based on {reviews.length} reviews</p>
            </div>

            <div className="lg:col-span-2 flex flex-col justify-center space-y-3">
              {ratingDistribution.map((r) => (
                <div key={r.star} className="flex items-center gap-3">
                  <span className="text-foreground text-sm font-medium w-8">{r.star} star</span>
                  <div className="flex-1 h-2.5 rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${r.pct}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground text-sm w-12 text-right">{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-md border border-border bg-card p-6 space-y-3">
                <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                <div className="h-4 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews?.map((review) => (
              <div key={review.id} className="rounded-md border border-border bg-card p-6" data-testid={`card-review-${review.id}`}>
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className={`h-4 w-4 ${i < review.rating ? "text-amber-400" : "text-border"}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <h4 className="text-foreground font-semibold mb-2">{review.title}</h4>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{review.body}</p>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-xs font-bold text-foreground">
                    {review.customerName.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-medium">{review.customerName}</p>
                    {review.verified && <p className="text-emerald-400 text-xs">Verified Purchase</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
