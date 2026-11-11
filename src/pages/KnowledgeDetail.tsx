import { Link, useParams } from "react-router-dom";
import { MathText } from "../components/MathText";
import { useTitle } from "../components/Ui";
import { bookShort, knowledgeById, knowledgeDocs, questions } from "../data/catalog";

export function KnowledgeDetail() {
  const { id = "" } = useParams();
  const doc = knowledgeById.get(id);
  useTitle(doc?.title ?? "知识点");
  if (!doc) return <div className="page"><h1>没有这篇知识点</h1><Link to="/knowledge">返回</Link></div>;
  const related = questions.filter((question) => question.knowledge_points.includes(doc.id));
  return (
    <div className="page narrow" data-page="knowledge">
      <p className="crumbs"><Link to="/knowledge">知识点</Link><span>/</span><span>{doc.category}</span></p>
      <article className="article knowledge">
        <MathText>{doc.body}</MathText>
        {doc.prerequisites.length > 0 ? (
          <p>先修：{doc.prerequisites.map((prereqId) => (
            <Link key={prereqId} to={`/knowledge/${prereqId}`}>{knowledgeById.get(prereqId)?.title ?? prereqId}</Link>
          ))}</p>
        ) : null}
        {doc.related.length > 0 ? (
          <p>相关知识点：{doc.related.map((relatedId) => (
            <Link key={relatedId} to={`/knowledge/${relatedId}`}>{knowledgeById.get(relatedId)?.title ?? relatedId}</Link>
          ))}</p>
        ) : null}
        {knowledgeDocs.some((item) => item.prerequisites.includes(doc.id)) ? (
          <p>接着可以学：{knowledgeDocs.filter((item) => item.prerequisites.includes(doc.id)).map((item) => (
            <Link key={item.id} to={`/knowledge/${item.id}`}>{item.title}</Link>
          ))}</p>
        ) : null}
      </article>
      <h2>用到这篇的题目</h2>
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
