import { useState } from "react";
import { Link } from "react-router-dom";
import { NoteEditor } from "../components/NoteEditor";
import { VariantDrill } from "../components/VariantDrill";
import { useTitle } from "../components/Ui";
import { bookShort, questionById, questions } from "../data/catalog";
import { isMistake, isWorkbookMistake, mistakeReasons } from "../lib/mistakes";
import { parseImported } from "../lib/storage";
import { previewText, todayStamp } from "../lib/text";
import { useUser } from "../lib/user";

export function Mistakes() {
  useTitle("错题集");
  const { data, setMastered, removeFromMistakes, replaceAll, reset } = useUser();
  const [filter, setFilter] = useState<"todo" | "all" | "done">("todo");
  const [message, setMessage] = useState("");
  const all = questions.filter((question) => isMistake(question, data));
  const list = all.filter((question) => {
    const mastered = Boolean(data.mastered[question.id]);
    if (filter === "todo") return !mastered;
    if (filter === "done") return mastered;
    return true;
  });
  const weak = [...new Set(all.filter((question) => !data.mastered[question.id]).flatMap((question) => question.knowledge_points))];

  function exportJson() {
    const blob = new Blob([JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `jojo-mistakes-${todayStamp()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function onImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseImported(JSON.parse(String(reader.result)));
        if (!parsed.ok) {
          setMessage(parsed.error);
          return;
        }
        if (!window.confirm("导入会覆盖这台设备上的错题记录，确定吗？")) return;
        replaceAll(parsed.data);
        const unknown = new Set(
          [...parsed.data.manual, ...Object.keys(parsed.data.practice), ...Object.keys(parsed.data.notes)].filter((id) => !questionById.has(id)),
        );
        setMessage(unknown.size ? `已导入。有 ${unknown.size} 条是当前题库里没有的题目，先替你留着。` : "已导入。");
      } catch {
        setMessage("这个文件不是能用的 JSON。");
      }
    };
    reader.readAsText(file, "utf-8");
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1>错题集</h1>
        <p>作业本上做错或部分对的题，加上练习时点了「不会」或手动加入的题。做对了但有批注的题不会自动进来。共 {all.length} 道，待复习 {all.filter((question) => !data.mastered[question.id]).length} 道。</p>
      </header>
      <div className="chips">
        <button type="button" className={filter === "todo" ? "chip on" : "chip"} onClick={() => setFilter("todo")}>待复习</button>
        <button type="button" className={filter === "all" ? "chip on" : "chip"} onClick={() => setFilter("all")}>全部</button>
        <button type="button" className={filter === "done" ? "chip on" : "chip"} onClick={() => setFilter("done")}>已掌握</button>
        <Link to="/mistakes/print" className="chip">打印</Link>
      </div>
      {list.length === 0 ? <p className="muted">这里还没有要复习的题。</p> : (
        <ul className="mistake-list">
          {list.map((question) => (
            <li key={question.id} className={data.mastered[question.id] ? "mistake-card done" : "mistake-card"}>
              <Link to={`/questions/${question.id}`}>
                <strong>{bookShort(question.book)} · {question.lesson}</strong>
                <span>{previewText(question.stem, 80)}</span>
              </Link>
              <p className="muted">{mistakeReasons(question, data).join("、")}</p>
              <div className="row-actions">
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

      <section className="manage no-print">
        <h2>备份</h2>
        <p className="muted">记录只在这台浏览器里。导入会覆盖本机记录。</p>
        {message ? <p>{message}</p> : null}
        <div className="row-actions">
          <button type="button" className="btn secondary" onClick={exportJson}>导出 JSON</button>
          <label className="btn secondary">导入 JSON
            <input type="file" accept="application/json,.json" hidden onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImport(file);
              event.target.value = "";
            }} />
          </label>
          <button type="button" className="btn tiny secondary" onClick={() => { if (window.confirm("清空这台设备上的练习记录、笔记和掌握标记？")) reset(); }}>清空本机记录</button>
        </div>
      </section>
    </div>
  );
}
