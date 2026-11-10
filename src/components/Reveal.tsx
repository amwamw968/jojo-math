import { useState } from "react";
import { MathText } from "./MathText";

export function Reveal({
  closedLabel,
  openLabel,
  text,
  empty,
}: {
  closedLabel: string;
  openLabel: string;
  text: string;
  empty: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className={open ? "reveal open" : "reveal"}>
      <button type="button" className="reveal-toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {open ? openLabel : closedLabel}
      </button>
      {open ? (
        <div className="reveal-body">
          {text.trim() ? <MathText>{text}</MathText> : <p className="muted">{empty}</p>}
        </div>
      ) : null}
    </section>
  );
}
