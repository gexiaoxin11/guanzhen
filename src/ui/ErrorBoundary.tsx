"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div style={{ padding: 40, textAlign: "center", color: "var(--ink-soft)" }}>
            <p style={{ fontSize: 16, color: "var(--ink)" }}>页面渲染出错</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>{this.state.error?.message || "未知错误"}</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              style={{
                marginTop: 16, padding: "8px 20px", borderRadius: 8,
                border: "1px solid var(--gold)", background: "transparent",
                color: "var(--gold)", cursor: "pointer",
              }}
            >
              重试
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
