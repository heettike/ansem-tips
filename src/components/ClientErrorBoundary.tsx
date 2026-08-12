"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { error: Error | null };

/** Keeps a Privy/wallet crash from blanking the whole app. */
export class ClientErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ClientErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="display-title text-2xl">Wallet UI hiccup</p>
          <p className="mt-3 text-sm text-muted">
            Auth SDK crashed on load. The rest of the site should still work after reload.
          </p>
          <p className="mt-2 break-all font-mono text-xs text-danger">
            {this.state.error.message}
          </p>
          <button
            type="button"
            className="btn-primary mt-6"
            onClick={() => this.setState({ error: null })}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
