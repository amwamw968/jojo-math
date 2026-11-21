import { useState } from "react";
import { MathText } from "./MathText";

export function Reveal({
  kicker,
  closedLabel,
  openLabel,
  text,
  empty,
}: {
  kicker?: string;
  closedLabel: string;
  openLabel: string;
  text: string;
  empty: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className={open ? "reveal open" : "reveal"}>
      {kicker ? <h2 className="sheet-label">{kicker}</h2> : null}
      <button type="button" className="reveal-toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {open ? openLabel : closedLabel}
      </button>
      {open ? (
        <div className="reveal-body explain">
          {text.trim() ? <MathText flow="stem">{text}</MathText> : <p className="muted">{empty}</p>}
        </div>
      ) : null}
    </section>
  );
}
