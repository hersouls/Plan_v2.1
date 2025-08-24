import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/utils';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary', 'caught error', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    const { onReset } = this.props;
    if (onReset) {
      onReset();
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <GlassCard className="max-w-md w-full p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>

              <div className="space-y-2">
                <h1
                  className="text-2xl font-bold"
                  style={{ color: 'var(--semantic-text-primary)' }}
                >
                  문제가 발생했습니다
                </h1>
                <p style={{ color: 'var(--semantic-text-secondary)' }}>
                  예기치 않은 오류가 발생했습니다. 불편을 드려 죄송합니다.
                </p>
              </div>

              {import.meta.env.DEV && this.state.error && (
                <details className="w-full text-left">
                  <summary
                    className="cursor-pointer text-sm"
                    style={{ color: 'var(--semantic-text-tertiary)' }}
                  >
                    오류 세부정보
                  </summary>
                  <div
                    className="mt-2 p-3 rounded-lg"
                    style={{ background: 'var(--glass-light)' }}
                  >
                    <p
                      className="text-xs font-mono"
                      style={{ color: 'var(--semantic-danger-500)' }}
                    >
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <pre
                        className="mt-2 text-xs overflow-auto max-h-40"
                        style={{ color: 'var(--semantic-text-tertiary)' }}
                      >
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              <div className="flex gap-3 w-full">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  다시 시도
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="default"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  홈으로
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}

// moved to separate helper to satisfy react-refresh rule
// withErrorBoundary HOC는 별도 파일로 이동: see ErrorBoundary.helpers.tsx

// Export the main ErrorBoundary as default
export { ErrorBoundary as default };
