import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "wouter";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h1>
            <p className="text-muted-foreground text-sm mb-2">
              The page couldn't load. Try refreshing or go back to the shop.
            </p>
            {this.state.error && (
              <p className="text-xs text-red-400 font-mono mb-6 break-all">
                {this.state.error.message}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                Try again
              </button>
              <Link href="/shop">
                <button className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background">
                  Back to Shop
                </button>
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
