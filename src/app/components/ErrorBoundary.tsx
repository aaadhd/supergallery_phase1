import { Component, type ErrorInfo, type ReactNode } from 'react';
import { getStoredLocale } from '../i18n/uiStrings';
import { translate, type MessageKey } from '../i18n/messages';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function t(key: MessageKey): string {
  return translate(getStoredLocale(), key);
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const desc = t('error.description').split('\n');

    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <svg
              className="h-8 w-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>

          <div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {t('error.title')}
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              {desc.map((line, i) => (
                <span key={i}>{line}{i < desc.length - 1 && <br />}</span>
              ))}
            </p>
          </div>

          {import.meta.env.DEV && this.state.error && (
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-left">
              <p className="text-xs font-mono text-red-600 break-all">
                {this.state.error.message}
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('error.retry')}
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              className="px-5 py-2.5 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            >
              {t('error.goHome')}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
