import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MathText } from "../components/MathText";
import { SameProblems } from "../components/SameProblems";
import { TypePill, useTitle } from "../components/Ui";
import { bookShort, books, questionById, questions } from "../data/catalog";
import { isMistake } from "../lib/mistakes";
import { figureUrl, formatWhen } from "../lib/text";
import { useUser } from "../lib/user";
import type { PracticeMark, Question } from "../types";

export function Practice() {
  useTitle("练习");
  const [params, setParams] = useSearchParams();
  const { data, storage, setPractice, skipPractice } = useUser();
  const [book, setBook] = useState(params.get("book") ?? "all");
  const [setName, setSetName] = useState(params.get("scope") === "mistakes" ? "mistakes" : "all");
  const [queue, setQueue] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [session, setSession] = useState<Record<string, PracticeMark>>({});
  const [sessionId, setSessionId] = useState("");
  const dataRef = useRef(data);
  dataRef.current = data;
  const idsParam = params.get("ids") ?? "";
  const retryKey = idsParam ? `ids:${idsParam}` : params.get("scope") === "mistakes" && params.get("start") === "1" ? "mistakes" : "";
  const previousKey = useRef<string | null>(null);

  useEffect(() => {
    if (previousKey.current === retryKey) return;
    const previous = previousKey.current;
    previousKey.current = retryKey;
    if (!retryKey) {
      if (previous) setQueue(null);
      return;
    }
    const ids = idsParam
      ? idsParam.split(",").map((id) => id.trim()).filter((id) => questionById.has(id))
      : questions.filter((question) => isMistake(question, dataRef.current) && !dataRef.current.mastered[question.id]).map((question) => question.id);
    setQueue(ids);
    setIndex(0);
    setShowAnswer(false);
    setSession({});
    setSessionId(crypto.randomUUID());
  }, [retryKey, idsParam]);

  function selectedIds() {
    return questions.filter((question) => {
      if (book !== "all" && question.book !== book) return false;
      if (setName === "fresh" && data.practice[question.id]) return false;
      if (setName === "mistakes" && !isMistake(question, data)) return false;
      return true;
    }).map((question) => question.id);
  }

  function start() {
    setSessionId(crypto.randomUUID());
    setQueue(selectedIds());
    setIndex(0);
    setShowAnswer(false);
    setSession({});
  }

  function backToSetup() {
    setQueue(null);
    setParams({}, { replace: true });
  }

  if (!queue) {
    const previewCount = selectedIds().length;
    const recent = [...data.practiceLog].reverse().slice(0, 30);
    return (
      <div className="page narrow" data-page="practice" data-practice="setup">
        <h1>练习</h1>
        <p>先自己算，想看答案再点开。会了、不会和跳过都记在这台设备上，刷新还在。</p>
        <p className="muted">这不会改作业本上的对错，也不会自动变成间隔复习评分。</p>
        <label className="field">范围
          <select value={book} onChange={(event) => setBook(event.target.value)}>
            <option value="all">全部 {questions.length} 道</option>
            {books.map((item) => <option key={item.id} value={item.id}>{bookShort(item.id)}</option>)}
          </select>
        </label>
        <div className="chips" role="group" aria-label="练习哪些">
          <button type="button" className={setName === "all" ? "chip on" : "chip"} onClick={() => setSetName("all")}>全部</button>
          <button type="button" className={setName === "fresh" ? "chip on" : "chip"} onClick={() => setSetName("fresh")}>还没练过</button>
          <button type="button" className={setName === "mistakes" ? "chip on" : "chip"} onClick={() => setSetName("mistakes")}>错题再练</button>
        </div>
        <button type="button" className="btn" onClick={start} disabled={previewCount === 0 || storage.practiceBlocked}>开始，共 {previewCount} 道</button>
        <section data-section="practice-history">
          <h2>练习记录</h2>
          {recent.length === 0 ? <p className="muted">还没有练习记录。</p> : (
            <ul className="history-list">
              {recent.map((entry) => {
                const item = questionById.get(entry.questionId);
                return (
                  <li key={entry.id}>
                    <Link to={item ? `/questions/${entry.questionId}` : "/questions"}>{item ? `${bookShort(item.book)} · ${item.lesson}` : entry.questionId}</Link>
                    <span>{entry.outcome}</span>
                    <span className="muted">{formatWhen(entry.at)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="page narrow" data-page="practice" data-practice="empty">
        <h1>没有要再练的题</h1>
        <button type="button" className="btn" onClick={backToSetup}>返回</button>
      </div>
    );
  }

  if (index >= queue.length) {
    const missed = Object.entries(session).filter(([, mark]) => mark === "不会");
    const got = Object.values(session).filter((mark) => mark === "会了").length;
    const missedIds = missed.map(([id]) => id).join(",");
    return (
      <div className="page narrow" data-page="practice" data-practice="done">
        <h1>这轮练完了</h1>
        <p className="lede">会了 {got} 道，不会 {missed.length} 道。记录已经留在这台设备上。</p>
        {missed.length > 0 ? (
          <ul className="plain-list">
            {missed.map(([id]) => {
              const item = questionById.get(id);
              return item ? <li key={id}><Link to={`/questions/${id}`}>{bookShort(item.book)} · {item.lesson}</Link></li> : null;
            })}
          </ul>
        ) : <p>这轮没有点「不会」。</p>}
        <div className="jump">
          <button type="button" className="btn" onClick={backToSetup}>再来一次</button>
          <Link to="/mistakes" className="btn secondary">去错题集</Link>
          {missedIds ? <Link to={`/mistakes/print?ids=${missedIds}`} className="btn secondary">打印这轮不会的</Link> : null}
        </div>
      </div>
    );
  }

  const question = questionById.get(queue[index]) as Question;
  function mark(value: PracticeMark) {
    setPractice(question.id, value, sessionId || "single");
    setSession((current) => ({ ...current, [question.id]: value }));
    setShowAnswer(false);
    setIndex((current) => current + 1);
  }

  return (
    <div className="page narrow" data-page="practice" data-practice="session">
      <p className="progress-label">第 {index + 1} / {queue.length} 题</p>
      <div className="bar"><span style={{ width: `${(index / queue.length) * 100}%` }} /></div>
      <article className="article">
        <div className="q-card-top">
          <TypePill type={question.type} />
          <span className="page-no">{bookShort(question.book)} · {question.lesson}</span>
        </div>
        <div className="stem-block"><MathText flow="stem">{question.stem}</MathText></div>
        {question.figure ? <figure className="figure"><img src={figureUrl(question.figure)} alt="" /></figure> : null}
        <SameProblems question={question} />
        <button type="button" className="reveal-toggle" aria-expanded={showAnswer} onClick={() => setShowAnswer((value) => !value)}>
          {showAnswer ? "收起答案" : "点一点，看答案"}
        </button>
        {showAnswer ? (
          <div className="reveal-body">
            <MathText>{question.answer}</MathText>
            {question.solution ? <MathText>{question.solution}</MathText> : null}
          </div>
        ) : null}
        <div className="choice-row">
          <button type="button" className="choice good" disabled={storage.practiceBlocked} onClick={() => mark("会了")}>会了</button>
          <button type="button" className="choice bad" disabled={storage.practiceBlocked} onClick={() => mark("不会")}>不会</button>
        </div>
        <button type="button" className="btn tiny secondary" disabled={storage.practiceBlocked} onClick={() => { skipPractice(question.id, sessionId || "single"); setShowAnswer(false); setIndex((current) => current + 1); }}>先跳过</button>
      </article>
    </div>
  );
}
