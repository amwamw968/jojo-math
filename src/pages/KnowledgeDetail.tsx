import { Link, useParams } from "react-router-dom";
import { MathText } from "../components/MathText";
import { EmptyNote, useTitle } from "../components/Ui";
import { bookShort, knowledgeById, knowledgeDocs, questions } from "../data/catalog";

export function KnowledgeDetail() {
  const { id = "" } = useParams();
  const doc = knowledgeById.get(id);
  useTitle(doc?.title ?? "知识点");
  if (!doc) {
    return (
      <div className="page narrow" data-page="knowledge">
        <header className="page-head"><h1>没有这篇知识点</h1></header>
        <Link className="btn" to="/knowledge">返回知识点</Link>
      </div>
    );
  }
  const related = questions.filter((question) => question.knowledge_points.includes(doc.id));
  const nextDocs = knowledgeDocs.filter((item) => item.prerequisites.includes(doc.id));
  return (
    <div className="page narrow" data-page="knowledge">
      <nav className="crumbs" aria-label="面包屑"><Link to="/knowledge">知识点</Link><span aria-hidden="true">/</span><span>{doc.category}</span></nav>
      <article className="article knowledge">
        <MathText>{doc.body}</MathText>
      </article>
      {doc.prerequisites.length > 0 || doc.related.length > 0 || nextDocs.length > 0 ? (
        <section className="panel relation" aria-label="知识关系">
          {doc.prerequisites.length > 0 ? (
            <div>
              <h2>先修</h2>
              <div className="chips">
                {doc.prerequisites.map((prereqId) => (
                  <Link key={prereqId} className="chip" to={`/knowledge/${prereqId}`}>{knowledgeById.get(prereqId)?.title ?? prereqId}</Link>
                ))}
              </div>
            </div>
          ) : null}
          {doc.related.length > 0 ? (
            <div>
              <h2>相关知识点</h2>
              <div className="chips">
                {doc.related.map((relatedId) => (
                  <Link key={relatedId} className="chip" to={`/knowledge/${relatedId}`}>{knowledgeById.get(relatedId)?.title ?? relatedId}</Link>
                ))}
              </div>
            </div>
          ) : null}
          {nextDocs.length > 0 ? (
            <div>
              <h2>接着可以学</h2>
              <div className="chips">
                {nextDocs.map((item) => (
                  <Link key={item.id} className="chip" to={`/knowledge/${item.id}`}>{item.title}</Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
      <h2>用到这篇的题目</h2>
      {related.length === 0 ? <EmptyNote>还没有题目用到这篇。</EmptyNote> : null}
      <ul className="plain-list">
        {related.map((question) => (
          <li key={question.id}>
            <Link to={`/questions/${question.id}`}>
              <strong>{bookShort(question.book)} · {question.type}</strong>
              <MathText flow="stem">{question.stem}</MathText>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
