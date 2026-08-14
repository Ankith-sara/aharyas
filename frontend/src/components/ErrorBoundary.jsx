import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-4 noto-serif-thai">
          Something went wrong
        </p>

        <h1 className="text-3xl sm:text-4xl noto-serif-thai font-normal text-black mb-3">
          AHARYAS
        </h1>

        <div className="w-24 h-px bg-black/20 my-5 mx-auto" />

        <p className="text-sm text-gray-500 font-light max-w-sm leading-relaxed mb-8">
          An unexpected error occurred on this page. Our team has been notified.
          Please return home and continue shopping.
        </p>

        {/* Error detail — dev only */}
        {process.env.NODE_ENV !== 'production' && this.state.error && (
          <pre className="text-left text-xs text-red-400 bg-red-50 border border-red-100 rounded px-4 py-3 max-w-lg w-full overflow-auto mb-8 font-mono">
            {this.state.error.toString()}
          </pre>
        )}

        <button
          onClick={this.handleReset}
          className="relative group px-10 py-3 border border-black text-black tracking-[0.25em] text-xs uppercase overflow-hidden"
        >
          <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
            Return Home
          </span>
          <span className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.77,0,0.175,1)]" />
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;