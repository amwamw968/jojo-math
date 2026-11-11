import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MathText } from "../components/MathText";
import { StorageBanner } from "../components/StorageBanner";
import { useTitle } from "../components/Ui";
import { bookShort, questionById, questions } from "../data/catalog";
import { isMistake } from "../lib/mistakes";
import { REVIEW_RATING_LABEL } from "../lib/review-schedule";
import { figureUrl, todayStamp } from "../lib/text";
import { useUser } from "../lib/user";
import type { Question } from "../types";

export function MistakesPrint() {
  useTitle("打印错题");
  const [params] = useSearchParams();
  const { data, due } = useUser();
  const [includeMastered, setIncludeMastered] = useState(false);
  const [includeAnswers, setIncludeAnswers] = useState(false);
  const idsParam = params.get("ids");
  const kind = params.get("kind");
  let title = "Jojo 错题复习单";
  let printKind = "mistakes";
  let list: Question[];
  if (idsParam) {
    title = "Jojo 再练复习单";
    printKind = "ids";
    list = idsParam.split(",").map((id) => questionById.get(id.trim())).filter((question): question is Question => Boolean(question));
  } else if (kind === "due") {
    title = "Jojo 到期复习单";
    printKind = "due";
    list = due.map((item) => questionById.get(item.questionId)).filter((question): question is Question => Boolean(question));
  } else {
    list = questions.filter((question) => isMistake(question, data) && (includeMastered || !data.mastered[question.id]));
  }

  return (
    <div className="print-page" data-app="jojo-math" data-page="print" data-print-kind={printKind}>
      <StorageBanner />
      <div className="print-toolbar no-print">
        <Link to="/mistakes">返回错题集</Link>
        {printKind === "mistakes" ? (
          <label><input type="checkbox" checked={includeMastered} onChange={(event) => setIncludeMastered(event.target.checked)} /> 包含已掌握</label>
        ) : <span>{printKind === "due" ? "只印已经评过分、并且到了复习时间的题。" : "只印这次选定的题。"}</span>}
        <label><input type="checkbox" checked={includeAnswers} onChange={(event) => setIncludeAnswers(event.target.checked)} /> 末页附上答案</label>
        <button type="button" className="btn" onClick={() => window.print()}>打印</button>
      </div>
      <article className="print-sheet">
        <h1>{title}</h1>
        <p>姓名 ________　日期 {todayStamp()}　用时 ________　共 {list.length} 道</p>
        {list.length === 0 ? <p>没有要打印的题。</p> : list.map((question, index) => {
          const card = due.find((item) => item.questionId === question.id);
          return (
            <section key={`${question.id}-${index}`} className="print-item">
              <h2>第 {index + 1} 题 · {bookShort(question.book)} · {question.lesson} · 第 {question.page} 页 · {question.id}</h2>
              {printKind === "due" && card ? <p>上次评分：{REVIEW_RATING_LABEL[card.lastRating]}</p> : null}
              <MathText flow="stem">{question.stem}</MathText>
              {question.figure ? <img src={figureUrl(question.figure)} alt="" /> : null}
              <p className="redo-label">订正</p>
              <div className="lines" />
            </section>
          );
        })}
        {includeAnswers && list.length > 0 ? (
          <section className="answer-key">
            <h2>答案与解析</h2>
            {list.map((question, index) => (
              <div key={`${question.id}-answer-${index}`}>
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
