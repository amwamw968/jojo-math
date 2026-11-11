import { Component, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { Link } from "react-router-dom";
import { remarkGroupEquations } from "../lib/group-equations";
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

export function MathText({
  children,
  className = "",
  flow = "prose",
}: {
  children: string;
  className?: string;
  flow?: "prose" | "stem";
}) {
  const source = normalizeMathDelimiters(children);
  const remarkPlugins = flow === "stem" ? [remarkMath, remarkGroupEquations] : [remarkMath];
  return (
    <MathBoundary key={`${flow}:${source}`} source={source}>
      <div className={`math-text ${flow === "stem" ? "stem-flow" : ""} ${className}`.trim()} data-math="">
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
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
