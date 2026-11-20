import { useEffect, type ReactNode } from "react";
import { DIFFICULTY_LABEL, PRODUCT_NAME } from "../lib/constants";
import type { JojoStatus, QuestionType } from "../types";

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title === "首页" ? PRODUCT_NAME : `${title} · ${PRODUCT_NAME}`;
  }, [title]);
}

const TYPE_TONE: Record<QuestionType, string> = {
  例题: "green",
  试一试: "sky",
  实战: "orange",
  练习: "amber",
  拓展: "rose",
};

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: string }) {
  return <span className={`pill tone-${tone}`}>{children}</span>;
}

function StatusMark({ status }: { status: JojoStatus }) {
  const path = status === "correct"
    ? "M5 12.5 9.2 16.5 19 7.5"
    : status === "wrong"
      ? "M8 8l8 8M16 8l-8 8"
      : status === "partial"
        ? "M6 12h12"
        : "M12 8v5M12 16.5h.01";
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d={path} />
    </svg>
  );
}

export function TypePill({ type }: { type: QuestionType }) {
  return <Pill tone={TYPE_TONE[type]}>{type}</Pill>;
}

export function Pips({ value }: { value: number }) {
  const label = DIFFICULTY_LABEL[value] ?? "";
  return (
    <span className="pips" aria-label={`难度 ${value}，${label}，共 5 级`}>
      <span className="pip-row" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} className={index < value ? "pip on" : "pip"} />
        ))}
      </span>
      {label ? <span className="pip-label">{label}</span> : null}
    </span>
  );
}

const STATUS_LABEL: Record<JojoStatus, string> = {
  correct: "做对了",
  wrong: "做错了",
  partial: "部分对",
  unclear: "看不清",
};

const STATUS_TONE: Record<JojoStatus, string> = {
  correct: "green",
  wrong: "rose",
  partial: "amber",
  unclear: "neutral",
};

export function StatusPill({ status }: { status: JojoStatus }) {
  return (
    <Pill tone={STATUS_TONE[status]}>
      <StatusMark status={status} />
      {STATUS_LABEL[status]}
    </Pill>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="empty" role="status">{children}</p>;
}

export function statusLabel(status: JojoStatus): string {
  return STATUS_LABEL[status];
}
