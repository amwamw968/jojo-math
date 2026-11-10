import { Component, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { Link } from "react-router-dom";
import { normalizeMathDelimiters } from "../lib/katex-check";

interface BoundaryProps {
  source: string;
  children: ReactNode;
}

interface BoundaryState {
  error: boolean;
}

class MathBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: false };

  static getDerivedStateFromError(): BoundaryState {
    return { error: true };
  }

  render() {
    if (this.state.error) {
      return <pre className="math-fallback">{this.props.source}</pre>;
    }
    return this.props.children;
  }
}

export function MathText({ children, className = "" }: { children: string; className?: string }) {
  const source = normalizeMathDelimiters(children);
  return (
    <MathBoundary key={source} source={source}>
      <div className={`math-text ${className}`.trim()} data-math="">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: "ignore", output: "html" }]]}
          components={{
            a: ({ href, children: linkChildren }) => {
              if (href?.startsWith("/")) return <Link to={href}>{linkChildren}</Link>;
              return (
                <a href={href} target="_blank" rel="noreferrer">
                  {linkChildren}
                </a>
              );
            },
          }}
        >
          {source}
        </ReactMarkdown>
      </div>
    </MathBoundary>
  );
}
