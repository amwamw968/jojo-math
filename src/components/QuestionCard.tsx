import { Link } from "react-router-dom";
import { bookShort, knowledgeById } from "../data/catalog";
import { workbookNote } from "../lib/mistakes";
import { stemPlain } from "../lib/text";
import { useUser } from "../lib/user";
import type { Question } from "../types";
import { Pips, StatusPill, TypePill } from "./Ui";

export function QuestionCard({ question }: { question: Question }) {
  const { data } = useUser();
  const mark = data.practice[question.id];
  const note = workbookNote(question);
  return (
    <Link to={`/questions/${question.id}`} className="q-card">
      <div className="q-card-top">
        <TypePill type={question.type} />
        <Pips value={question.difficulty} />
        <span className="page-no">第 {question.page} 页</span>
      </div>
      <p className="card-stem">{stemPlain(question.stem)}</p>
      <div className="q-card-tags">
        {question.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
        {question.knowledge_points.slice(0, 2).map((id) => (
          <span key={id} className="tag quiet">
            {knowledgeById.get(id)?.title ?? id}
          </span>
        ))}
      </div>
      <div className="q-card-foot">
        <span>{bookShort(question.book)}</span>
        {question.jojo ? <StatusPill status={question.jojo.status} /> : null}
        {note ? <span className="tag note-tag">有批注</span> : null}
        {mark ? <span className={mark === "会了" ? "mark good" : "mark bad"}>{mark}</span> : null}
      </div>
    </Link>
  );
}
