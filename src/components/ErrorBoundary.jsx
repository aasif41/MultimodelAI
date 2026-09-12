import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-[#FB7185] bg-[#FB7185]/10 border border-[#FB7185]/20 px-3.5 py-2.5 rounded-xl text-sm font-medium">
          Failed to render Markdown: {this.state.error?.message}
        </div>
      );
    }
    return this.props.children;
  }
}
