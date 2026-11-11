import { Link, useParams } from "react-router-dom";
import { VariantDrill } from "../components/VariantDrill";
import { useTitle } from "../components/Ui";
import { bookShort, knowledgeById } from "../data/catalog";
import { isMistake } from "../lib/mistakes";
import { questionsForLecture } from "../lib/lectures";
import { lectureLabel, trackOfLecture } from "../lib/syllabus-data";
import { MathText } from "../components/MathText";
import { useUser } from "../lib/user";

export function LectureDetail() {
  const { id = "" } = useParams();
  const track = trackOfLecture(id);
  const lecture = track?.lectures.find((item) => item.id === id);
  useTitle(lecture ? lectureLabel(lecture) : "讲次");
  const { data } = useUser();
  if (!lecture || !track) return <div className="page" data-page="lecture"><h1>没有这一讲</h1><Link to="/lectures">返回讲次</Link></div>;
  const own = questionsForLecture(lecture);
  const mistakes = own.filter((question) => isMistake(question, data) && !data.mastered[question.id]);

  return (
    <div className="page" data-page="lecture">
      <p className="crumbs"><Link to="/lectures">讲次</Link><span>/</span><span>{track.title}</span></p>
      <header className="page-head">
        <span className={lecture.status === "待补" ? "pill tone-amber" : "pill tone-green"}>{lecture.status}</span>
        <h1>{lectureLabel(lecture)}</h1>
        <p>{lecture.note}</p>
      </header>
      {lecture.status === "待补" ? <p>这一讲的标题和题目都还没录入。</p> : (
        <>
          <div className="chips">
            {lecture.sources.map((source) => (
              <Link key={`${source.book}-${source.chapter}`} className="chip" to={`/questions?book=${source.book}&chapter=${source.chapter}`}>
                {bookShort(source.book)} · {source.chapter}
              </Link>
            ))}
          </div>
          <h2>知识点</h2>
          <div className="chips">
            {lecture.knowledge_points.map((kp) => (
              <Link key={kp} className="chip" to={`/knowledge/${kp}`}>{knowledgeById.get(kp)?.title ?? kp}</Link>
            ))}
          </div>
          {lecture.knowledge_points.some((kp) => (knowledgeById.get(kp)?.prerequisites.length ?? 0) > 0) ? (
            <>
              <h2>先修</h2>
              <ul className="plain-list">
                {lecture.knowledge_points.map((kp) => {
                  const doc = knowledgeById.get(kp);
                  if (!doc || doc.prerequisites.length === 0) return null;
                  return (
                    <li key={kp}>
                      <Link to={`/knowledge/${kp}`}>{doc.title}</Link>
                      <span>：先学 </span>
                      {doc.prerequisites.map((prereqId, index) => (
                        <span key={prereqId}>
                          {index > 0 ? "、" : ""}
                          <Link to={`/knowledge/${prereqId}`}>{knowledgeById.get(prereqId)?.title ?? prereqId}</Link>
                        </span>
                      ))}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
          <h2>这一讲的错题</h2>
          {mistakes.length === 0 ? <p className="muted">这一讲还没有待复习的错题。</p> : (
            <ul className="plain-list">
              {mistakes.map((question) => (
                <li key={question.id}><Link to={`/questions/${question.id}`}><strong>{bookShort(question.book)}</strong><MathText flow="stem">{question.stem}</MathText></Link></li>
              ))}
            </ul>
          )}
          <h2>题目</h2>
          <ul className="plain-list">
            {own.map((question) => (
              <li key={question.id}>
                <Link to={`/questions/${question.id}`}>
                  <strong>{bookShort(question.book)} · {question.type} · 第 {question.page} 页</strong>
                  <MathText flow="stem">{question.stem}</MathText>
                </Link>
              </li>
            ))}
          </ul>
          <h2>举一反三</h2>
          {lecture.engines.length === 0 ? <p className="muted">这一讲还没有变式题。</p> : (
            <>
              <p className="muted">下面的题是按这一讲的算法新算出来的，不是书上的原题。</p>
              <VariantDrill ids={[lecture.id]} count={4} />
            </>
          )}
        </>
      )}
    </div>
  );
}
