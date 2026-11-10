import { Link } from "react-router-dom";
import { useTitle } from "../components/Ui";
import { knowledgeDocs, questions } from "../data/catalog";
import { CATEGORIES } from "../lib/constants";

export function KnowledgeList() {
  useTitle("知识点");
  const groups = CATEGORIES.map((category) => ({
    category,
    docs: knowledgeDocs.filter((doc) => doc.category === category),
  })).filter((group) => group.docs.length > 0);

  return (
    <div className="page" data-page="knowledge-list">
      <header className="page-head">
        <h1>知识点</h1>
        <p>按计算、数论、几何这些类别排。每篇下面能看到用到它的题目。</p>
      </header>
      {groups.map((group) => (
        <section key={group.category}>
          <h2>{group.category}</h2>
          <div className="book-grid">
            {group.docs.map((doc) => {
              const count = questions.filter((question) => question.knowledge_points.includes(doc.id)).length;
              return (
                <Link key={doc.id} to={`/knowledge/${doc.id}`} className="book-card">
                  <h3>{doc.title}</h3>
                  <p>{count} 道相关题目</p>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
