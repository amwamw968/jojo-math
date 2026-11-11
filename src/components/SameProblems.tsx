import { Link } from "react-router-dom";
import { bookShort, questionById } from "../data/catalog";
import { hasOfficialAgreement, sameProblemIds } from "../lib/same";
import { MathText } from "./MathText";
import type { Question } from "../types";

export function SameProblems({ question }: { question: Question }) {
  const others = sameProblemIds(question)
    .map((id) => questionById.get(id))
    .filter((item): item is Question => Boolean(item));
  const official = hasOfficialAgreement(question);
  if (!official && others.length === 0) return null;
  return (
    <aside className="same-box">
      {official ? <p className="official">官方答案一致</p> : null}
      {others.length > 0 ? (
        <>
          <p>这道题和下面的是同一道题：</p>
          <ul>
            {others.map((other) => (
              <li key={other.id}>
                <Link to={`/questions/${other.id}`}>
                  {bookShort(other.book)} · {other.lesson || other.chapter_title} · 第 {other.page} 页
                </Link>
                <MathText flow="stem">{other.stem}</MathText>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </aside>
  );
}
