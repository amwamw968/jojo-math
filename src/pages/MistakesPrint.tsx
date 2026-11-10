import { useState } from "react";
import { Link } from "react-router-dom";
import { MathText } from "../components/MathText";
import { bookShort, questions } from "../data/catalog";
import { isMistake } from "../lib/mistakes";
import { figureUrl, todayStamp } from "../lib/text";
import { useUser } from "../lib/user";
import { useTitle } from "../components/Ui";

export function MistakesPrint() {
  useTitle("打印错题");
  const { data } = useUser();
  const [includeMastered, setIncludeMastered] = useState(false);
  const [includeAnswers, setIncludeAnswers] = useState(false);
  const list = questions.filter((question) => isMistake(question, data) && (includeMastered || !data.mastered[question.id]));

  return (
    <div className="print-page" data-app="jojo-math" data-page="print">
      <div className="print-toolbar no-print">
        <Link to="/mistakes">返回错题集</Link>
        <label><input type="checkbox" checked={includeMastered} onChange={(event) => setIncludeMastered(event.target.checked)} /> 包含已掌握</label>
        <label><input type="checkbox" checked={includeAnswers} onChange={(event) => setIncludeAnswers(event.target.checked)} /> 末页附上答案</label>
        <button type="button" className="btn" onClick={() => window.print()}>打印</button>
      </div>
      <article className="print-sheet">
        <h1>Jojo 错题复习单</h1>
        <p>{todayStamp()} · {list.length} 道</p>
        {list.length === 0 ? <p>没有要打印的题。</p> : list.map((question, index) => (
          <section key={question.id} className="print-item">
            <h2>第 {index + 1} 题 · {bookShort(question.book)} · {question.lesson} · 第 {question.page} 页</h2>
            <MathText>{question.stem}</MathText>
            {question.figure ? <img src={figureUrl(question.figure)} alt="" /> : null}
            <p className="redo-label">订正</p>
            <div className="lines" />
          </section>
        ))}
        {includeAnswers && list.length > 0 ? (
          <section className="answer-key">
            <h2>答案与解析</h2>
            {list.map((question, index) => (
              <div key={question.id}>
                <h3>第 {index + 1} 题</h3>
                <MathText>{question.answer}</MathText>
                {question.solution ? <MathText>{question.solution}</MathText> : null}
                {question.jojo?.note ? <p>作业本批注：<MathText className="inline">{question.jojo.note}</MathText></p> : null}
              </div>
            ))}
          </section>
        ) : null}
      </article>
    </div>
  );
}
