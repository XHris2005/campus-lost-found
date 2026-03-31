import { Component } from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-card">
            <div className="error-boundary-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p>
              An unexpected error occurred. Please try refreshing the page.
              If the problem persists, contact support.
            </p>
            <div className="error-boundary-actions">
              <button
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => window.location.href = '/dashboard'}
              >
                Go to Dashboard
              </button>
            </div>
            {import.meta.env.DEV && (
              <details className="error-boundary-details">
                <summary>Error details (dev only)</summary>
                <pre>{this.state.error?.toString()}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;