import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

import { Heading } from "../ui/Heading.js";
import { Typography } from "../ui/Typography.js";

export type ErrorBoundaryLabels = {
  title: string;
  subtitle: string;
  tryAgain: string;
  goHome: string;
  persistMessage: string;
};

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  labels: ErrorBoundaryLabels;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = (): void => {
    window.location.href = "/";
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          labels={this.props.labels}
          onGoHome={this.handleGoHome}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

type ErrorFallbackProps = {
  error: Error | null;
  labels: ErrorBoundaryLabels;
  onRetry: () => void;
  onGoHome: () => void;
};

function ErrorFallback({
  error,
  labels,
  onRetry,
  onGoHome,
}: ErrorFallbackProps) {
  const isDev =
    (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="rounded-box border-base-300 bg-base-100 w-full max-w-lg border-(length:--border) p-8">
        <div className="flex items-center gap-3">
          <div className="bg-error/10 text-error rounded-full p-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <Heading as="h1">{labels.title}</Heading>
            <p>
              <Typography variant="subtitle">{labels.subtitle}</Typography>
            </p>
          </div>
        </div>

        {isDev && error && (
          <div className="mt-6">
            <div className="text-error mb-2">
              <Typography variant="body">
                {error.name}: {error.message}
              </Typography>
            </div>
            {error.stack && (
              <pre className="bg-base-200 rounded-box max-h-48 overflow-auto p-3">
                <Typography variant="mono">{error.stack}</Typography>
              </pre>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="btn btn-primary gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {labels.tryAgain}
          </button>
          <button
            type="button"
            onClick={onGoHome}
            className="btn btn-outline gap-2"
          >
            <Home className="h-4 w-4" />
            {labels.goHome}
          </button>
        </div>

        <p className="mt-6">
          <Typography variant="hint">{labels.persistMessage}</Typography>
        </p>
      </div>
    </div>
  );
}
