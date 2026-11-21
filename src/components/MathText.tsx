import { Component, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { Link } from "react-router-dom";
import { remarkGroupEquations, remarkWrapBlanks, remarkWrapDisplay } from "../lib/group-equations";
import { rehypeKeepPunctuation } from "../lib/keep-punctuation";
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
  const remarkPlugins =
    flow === "stem"
      ? [remarkGfm, remarkMath, remarkGroupEquations, remarkWrapDisplay]
      : [remarkGfm, remarkMath, remarkWrapBlanks, remarkWrapDisplay];
  return (
    <MathBoundary key={`${flow}:${source}`} source={source}>
      <div className={`math-text ${flow === "stem" ? "stem-flow" : ""} ${className}`.trim()} data-math="">
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: "ignore", output: "html" }], rehypeKeepPunctuation]}
          components={{
            a: ({ href, children: linkChildren }) => {
              if (href?.startsWith("/")) return <Link to={href}>{linkChildren}</Link>;
              return (
                <a href={href} target="_blank" rel="noreferrer">
                  {linkChildren}
                </a>
              );
            },
            table: ({ children: tableChildren }) => (
              <div className="table-scroll">
                <table>{tableChildren}</table>
              </div>
            ),
            img: ({ src, alt }) => <img src={src} alt={alt ?? ""} />,
          }}
        >
          {source}
        </ReactMarkdown>
      </div>
    </MathBoundary>
  );
}
