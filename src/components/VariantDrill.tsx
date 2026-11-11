import { useMemo, useState } from "react";
import { generateVariants } from "../engine/generate";
import { ENG } from "../engine/engines";
import { MathText } from "./MathText";

export function VariantDrill({
  ids,
  count,
  emptyHint,
}: {
  ids: string[];
  count: number;
  emptyHint?: string;
}) {
  const [seed, setSeed] = useState(7);
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const variants = useMemo(
    () => ids.flatMap((id, index) => generateVariants(id, count, seed + index * 997)),
    [ids, count, seed],
  );

  if (ids.length === 0) return emptyHint ? <p className="muted">{emptyHint}</p> : null;

  return (
    <div className="variant-drill">
      <div className="row-actions no-print">
        <button type="button" className="btn secondary" onClick={() => { setSeed((value) => value + 1); setOpen({}); }}>
          再出一组
        </button>
        <span className="muted">种子 {seed}，同一种子可以再印出同样的题。</span>
      </div>
      {variants.length === 0 ? <p className="muted">这一讲还没有变式题。</p> : null}
      <ol className="variant-list">
        {variants.map((variant, index) => (
          <li key={`${seed}-${index}`} className="variant-card">
            <div className="q-card-top">
              <span className="pill tone-green">{ENG[variant.engine].name}</span>
            </div>
            <MathText flow="stem">{variant.stem}</MathText>
            <button
              type="button"
              className="reveal-toggle"
              aria-expanded={Boolean(open[index])}
              onClick={() => setOpen((current) => ({ ...current, [index]: !current[index] }))}
            >
              <span>{open[index] ? "收起答案" : "点一点，看答案"}</span>
            </button>
            {open[index] ? (
              <div className="reveal-body">
                <p className="variant-answer"><strong>答案 </strong><MathText className="inline">{variant.answer}</MathText></p>
                <MathText>{variant.solution}</MathText>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
