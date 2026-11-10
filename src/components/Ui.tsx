import { useEffect } from "react";
import { DIFFICULTY_LABEL } from "../lib/constants";
import type { JojoStatus, QuestionType } from "../types";

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title === "首页" ? "乔乔奥数" : `${title} · 乔乔奥数`;
  }, [title]);
}

const TYPE_TONE: Record<QuestionType, string> = {
  例题: "green",
  试一试: "sky",
  实战: "orange",
  练习: "amber",
  拓展: "rose",
};

export function Pill({ children, tone = "neutral" }: { children: string; tone?: string }) {
  return <span className={`pill tone-${tone}`}>{children}</span>;
}

export function TypePill({ type }: { type: QuestionType }) {
  return <Pill tone={TYPE_TONE[type]}>{type}</Pill>;
}

export function Pips({ value }: { value: number }) {
  const label = DIFFICULTY_LABEL[value] ?? "";
  return (
    <span className="pips" aria-label={`难度 ${value}，${label}，共 5 级`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < value ? "pip on" : "pip"} />
      ))}
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
  return <Pill tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Pill>;
}

export function statusLabel(status: JojoStatus): string {
  return STATUS_LABEL[status];
}
