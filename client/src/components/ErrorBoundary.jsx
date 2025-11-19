import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    console.error("Uncaught error:", error, info);
  }

  render() {
    const { error, info } = this.state;
    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6" data-theme="night">
          <div className="max-w-2xl w-full bg-base-100 border border-error/20 p-6 rounded">
            <h2 className="text-xl font-bold text-error mb-2">An error occurred</h2>
            <pre className="text-xs whitespace-pre-wrap max-h-64 overflow-auto bg-base-200 p-3 rounded">{String(error && error.toString())}</pre>
            {info?.componentStack && (
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer">Component stack</summary>
                <pre className="whitespace-pre-wrap max-h-48 overflow-auto bg-base-200 p-3 rounded mt-2">{info.componentStack}</pre>
              </details>
            )}
            <div className="mt-4 flex gap-2">
              <button className="btn btn-primary" onClick={() => window.location.reload()}>
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
