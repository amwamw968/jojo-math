import { useState } from "react";
import { Link } from "react-router-dom";
import { MathText } from "../components/MathText";
import { NoteEditor } from "../components/NoteEditor";
import { ProgressBackup } from "../components/ProgressBackup";
import { VariantDrill } from "../components/VariantDrill";
import { useTitle } from "../components/Ui";
import { bookShort, questions } from "../data/catalog";
import { isMistake, isWorkbookMistake, mistakeReasons } from "../lib/mistakes";
import { useUser } from "../lib/user";

export function Mistakes() {
  useTitle("错题集");
  const { data, due, setMastered, removeFromMistakes } = useUser();
  const [filter, setFilter] = useState<"todo" | "all" | "done">("todo");
  const all = questions.filter((question) => isMistake(question, data));
  const list = all.filter((question) => {
    const mastered = Boolean(data.mastered[question.id]);
    if (filter === "todo") return !mastered;
    if (filter === "done") return mastered;
    return true;
  });
  const weak = [...new Set(all.filter((question) => !data.mastered[question.id]).flatMap((question) => question.knowledge_points))];

  return (
    <div className="page" data-page="mistakes">
      <header className="page-head">
        <h1>错题集</h1>
        <p>作业本上做错或部分对的题，加上练习时点了「不会」或手动加入的题。做对了但有批注的题不会自动进来。共 {all.length} 道，待复习 {all.filter((question) => !data.mastered[question.id]).length} 道。</p>
        <p className="muted">再练只记会了或不会。间隔复习要另外评分，不会把作业本的对错换算过去。{due.length ? `今天有 ${due.length} 道到了复习时间。` : "还没有到期限的复习评分。"}</p>
      </header>
      <div className="chips">
        <button type="button" className={filter === "todo" ? "chip on" : "chip"} onClick={() => setFilter("todo")}>待复习</button>
        <button type="button" className={filter === "all" ? "chip on" : "chip"} onClick={() => setFilter("all")}>全部</button>
        <button type="button" className={filter === "done" ? "chip on" : "chip"} onClick={() => setFilter("done")}>已掌握</button>
        <Link to="/practice?scope=mistakes&start=1" className="chip">再练待复习</Link>
        <Link to="/review" className="chip">到期复习</Link>
        <Link to="/mistakes/print" className="chip">打印</Link>
        {due.length ? <Link to="/mistakes/print?kind=due" className="chip">打印到期</Link> : null}
      </div>
      {list.length === 0 ? <p className="muted">这里还没有要复习的题。</p> : (
        <ul className="mistake-list">
          {list.map((question) => (
            <li key={question.id} className={data.mastered[question.id] ? "mistake-card done" : "mistake-card"}>
              <Link to={`/questions/${question.id}`}>
                <strong>{bookShort(question.book)} · {question.lesson}</strong>
                <MathText flow="stem">{question.stem}</MathText>
              </Link>
              <p className="muted">{mistakeReasons(question, data).join("、")}</p>
              <div className="row-actions">
                <Link className="btn tiny secondary" to={`/practice?ids=${question.id}`}>再练这题</Link>
                <Link className="btn tiny secondary" to={`/review?id=${question.id}`}>间隔复习</Link>
                <button type="button" className={data.mastered[question.id] ? "btn tiny" : "btn tiny secondary"} onClick={() => setMastered(question.id, !data.mastered[question.id])}>
                  {data.mastered[question.id] ? "已掌握" : "标记掌握"}
                </button>
                {!isWorkbookMistake(question) ? <button type="button" className="btn tiny secondary" onClick={() => removeFromMistakes(question.id)}>移出</button> : null}
              </div>
              <NoteEditor questionId={question.id} />
            </li>
          ))}
        </ul>
      )}

      <section className="article">
        <h2>举一反三</h2>
        <p className="muted">{weak.length ? "按还没掌握的知识点，各出 2 道新题。" : "现在没有待复习的错题，先按第 1 讲出两道。"}</p>
        <VariantDrill ids={weak.length ? weak : ["gs-autumn-4-l01"]} count={weak.length ? 2 : 2} />
      </section>

      <ProgressBackup />
    </div>
  );
}
