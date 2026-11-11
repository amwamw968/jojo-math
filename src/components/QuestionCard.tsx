import { Link } from "react-router-dom";
import { bookShort, knowledgeById } from "../data/catalog";
import { workbookNote } from "../lib/mistakes";
import { sameProblemIds } from "../lib/same";
import { useUser } from "../lib/user";
import type { Question } from "../types";
import { MathText } from "./MathText";
import { Pips, StatusPill, TypePill } from "./Ui";

export function QuestionCard({ question }: { question: Question }) {
  const { data } = useUser();
  const mark = data.practice[question.id];
  const note = workbookNote(question);
  const same = sameProblemIds(question).length > 0;
  const tags = question.tags.filter((tag) => tag !== question.type && !tag.startsWith("同题:")).slice(0, 3);
  const topics = question.knowledge_points.slice(0, 2);
  return (
    <Link to={`/questions/${question.id}`} className="q-card">
      <span className="q-card-top">
        <TypePill type={question.type} />
        <Pips value={question.difficulty} />
        <span className="page-no">第 {question.page} 页</span>
      </span>
      <MathText className="card-math" flow="stem">{question.stem}</MathText>
      {tags.length > 0 || topics.length > 0 ? (
        <span className="q-card-tags">
          {tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
          {topics.map((id) => (
            <span key={id} className="tag quiet">
              {knowledgeById.get(id)?.title ?? id}
            </span>
          ))}
        </span>
      ) : null}
      <span className="q-card-foot">
        <span className="q-card-book">{bookShort(question.book)}</span>
        {question.jojo ? <StatusPill status={question.jojo.status} /> : null}
        {note ? <span className="tag note-tag">有批注</span> : null}
        {same ? <span className="tag same">同题</span> : null}
        {mark ? <span className={mark === "会了" ? "mark good" : "mark bad"}>{mark}</span> : null}
      </span>
    </Link>
  );
}
