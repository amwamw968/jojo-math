import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MathText } from "../components/MathText";
import { SameProblems } from "../components/SameProblems";
import { TypePill, useTitle } from "../components/Ui";
import { bookShort, books, questionById, questions } from "../data/catalog";
import { isMistake } from "../lib/mistakes";
import { figureUrl } from "../lib/text";
import { useUser } from "../lib/user";
import type { PracticeMark, Question } from "../types";

export function Practice() {
  useTitle("练习");
  const [params] = useSearchParams();
  const { data, setPractice } = useUser();
  const [book, setBook] = useState(params.get("book") ?? "all");
  const [setName, setSetName] = useState(params.get("scope") === "mistakes" ? "mistakes" : "all");
  const [queue, setQueue] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [session, setSession] = useState<Record<string, PracticeMark>>({});

  const previewCount = useMemo(() => questions.filter((question) => {
    if (book !== "all" && question.book !== book) return false;
    if (setName === "fresh" && data.practice[question.id]) return false;
    if (setName === "mistakes" && !isMistake(question, data)) return false;
    return true;
  }).length, [book, setName, data]);

  function start() {
    const ids = questions.filter((question) => {
      if (book !== "all" && question.book !== book) return false;
      if (setName === "fresh" && data.practice[question.id]) return false;
      if (setName === "mistakes" && !isMistake(question, data)) return false;
      return true;
    }).map((question) => question.id);
    setQueue(ids);
    setIndex(0);
    setShowAnswer(false);
    setSession({});
  }

  if (!queue) {
    return (
      <div className="page narrow" data-page="practice">
        <h1>练习</h1>
        <p>先自己算，想看答案再点开。会了或不会都会记在这台设备上。</p>
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
        <button type="button" className="btn" onClick={start} disabled={previewCount === 0}>开始，共 {previewCount} 道</button>
      </div>
    );
  }

  if (index >= queue.length) {
    const missed = Object.entries(session).filter(([, mark]) => mark === "不会");
    const got = Object.values(session).filter((mark) => mark === "会了").length;
    return (
      <div className="page narrow" data-page="practice">
        <h1>这轮练完了</h1>
        <p className="lede">会了 {got} 道，不会 {missed.length} 道。</p>
        {missed.length > 0 ? (
          <ul className="plain-list">
            {missed.map(([id]) => {
              const question = questionById.get(id);
              return question ? <li key={id}><Link to={`/questions/${id}`}>{bookShort(question.book)} · {question.lesson}</Link></li> : null;
            })}
          </ul>
        ) : <p>这轮没有点「不会」。</p>}
        <div className="jump">
          <button type="button" className="btn" onClick={() => setQueue(null)}>再来一次</button>
          <Link to="/mistakes" className="btn secondary">去错题集</Link>
        </div>
      </div>
    );
  }

  const question = questionById.get(queue[index]) as Question;
  function mark(value: PracticeMark) {
    setPractice(question.id, value);
    setSession((current) => ({ ...current, [question.id]: value }));
    setShowAnswer(false);
    setIndex((current) => current + 1);
  }

  return (
    <div className="page narrow" data-page="practice">
      <p className="progress-label">第 {index + 1} / {queue.length} 题</p>
      <div className="bar"><span style={{ width: `${(index / queue.length) * 100}%` }} /></div>
      <article className="article">
        <div className="q-card-top">
          <TypePill type={question.type} />
          <span className="page-no">{bookShort(question.book)} · {question.lesson}</span>
        </div>
        <div className="stem-block"><MathText>{question.stem}</MathText></div>
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
          <button type="button" className="choice good" onClick={() => mark("会了")}>会了</button>
          <button type="button" className="choice bad" onClick={() => mark("不会")}>不会</button>
        </div>
        <button type="button" className="btn tiny secondary" onClick={() => { setShowAnswer(false); setIndex((current) => current + 1); }}>先跳过</button>
      </article>
    </div>
  );
}
