import { Link, useParams } from "react-router-dom";
import { MathText } from "../components/MathText";
import { NoteEditor } from "../components/NoteEditor";
import { Reveal } from "../components/Reveal";
import { SameProblems } from "../components/SameProblems";
import { Pips, StatusPill, TypePill, useTitle } from "../components/Ui";
import { bookById, bookShort, knowledgeById, questionById, questions } from "../data/catalog";
import { isWorkbookMistake, mistakeReasons, workbookNote } from "../lib/mistakes";
import { lectureOfQuestion } from "../lib/lectures";
import { figureUrl, formatWhen } from "../lib/text";
import { useUser } from "../lib/user";

export function QuestionDetail() {
  const { id = "" } = useParams();
  const question = questionById.get(id);
  useTitle(question ? bookShort(question.book) : "题目");
  const { data, schedule, storage, setPractice, addManual, removeFromMistakes, setMastered } = useUser();
  if (!question) {
    return <div className="page"><h1>题库里没有这道题</h1><Link to="/questions">回题库</Link></div>;
  }
  const book = bookById.get(question.book);
  const siblings = questions.filter((item) => item.book === question.book && item.chapter === question.chapter);
  const index = siblings.findIndex((item) => item.id === question.id);
  const prev = index > 0 ? siblings[index - 1] : undefined;
  const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined;
  const reasons = mistakeReasons(question, data);
  const lecture = lectureOfQuestion(question);
  const mark = data.practice[question.id];
  const scheduled = schedule.find((item) => item.questionId === question.id);

  return (
    <div className="page narrow" data-page="question">
      <p className="crumbs">
        <Link to="/questions">题库</Link>
        <span>/</span>
        <Link to={`/questions?book=${question.book}`}>{bookShort(question.book)}</Link>
        <span>/</span>
        <span>{question.chapter} {question.chapter_title}</span>
      </p>
      <article className="article">
        <div className="q-card-top">
          <TypePill type={question.type} />
          <Pips value={question.difficulty} />
          <span className="page-no">第 {question.page} 页</span>
          <span className="page-no">{question.id}</span>
        </div>
        <h1>{question.lesson || question.chapter_title}</h1>
        {book ? <p className="muted">{book.title}</p> : null}
        <div className="q-card-tags">
          {question.tags.map((tag) => <span key={tag} className={tag.startsWith("同题:") ? "tag same" : "tag"}>{tag.startsWith("同题:") ? "同题" : tag}</span>)}
        </div>
        <div className="stem-block"><MathText>{question.stem}</MathText></div>
        {question.figure ? (
          <figure className="figure">
            <img src={figureUrl(question.figure)} alt={`${question.id} 的配图`} />
          </figure>
        ) : null}
        <div className="q-card-tags">
          {question.knowledge_points.map((kp) => (
            <Link key={kp} className="tag quiet" to={`/knowledge/${kp}`}>{knowledgeById.get(kp)?.title ?? kp}</Link>
          ))}
        </div>
        {lecture?.title ? (
          <p className="muted">这一讲：<Link to={`/lectures/${lecture.id}`}>{lecture.number ? `第 ${lecture.number} 讲 ` : ""}{lecture.title}</Link></p>
        ) : null}
        <SameProblems question={question} />
        {question.jojo ? (
          <section className="workbook">
            <h2>作业本</h2>
            <p><StatusPill status={question.jojo.status} /></p>
            {question.jojo.answer ? <p>当时写下：<MathText className="inline">{question.jojo.answer}</MathText></p> : null}
            {workbookNote(question) ? <p>批注：<MathText className="inline">{workbookNote(question)}</MathText></p> : null}
          </section>
        ) : <p className="muted">作业本上没有这道题的作答记录。</p>}
        <Reveal closedLabel="点一点，看答案" openLabel="收起答案" text={question.answer} empty="还没有答案" />
        <Reveal closedLabel="点一点，看解析" openLabel="收起解析" text={question.solution} empty="还没有解析" />
        <div className="choice-row">
          <button type="button" className={mark === "会了" ? "choice good on" : "choice good"} aria-pressed={mark === "会了"} disabled={storage.practiceBlocked} onClick={() => setPractice(question.id, "会了")}>会了</button>
          <button type="button" className={mark === "不会" ? "choice bad on" : "choice bad"} aria-pressed={mark === "不会"} disabled={storage.practiceBlocked} onClick={() => setPractice(question.id, "不会")}>不会</button>
        </div>
        <div className="row-actions">
          <Link className="btn secondary" to={`/practice?ids=${question.id}`}>再练这题</Link>
          <Link className="btn secondary" to={`/review?id=${question.id}`}>间隔复习评分</Link>
        </div>
        {scheduled ? <p className="muted">间隔复习下次到期 {formatWhen(scheduled.due)}。这不改变作业本状态。</p> : null}
        {reasons.length === 0 ? (
          <button type="button" className="btn secondary" onClick={() => addManual(question.id)}>加入错题集</button>
        ) : (
          <div className="mistake-actions">
            <p>已在错题集：{reasons.join("、")}。</p>
            {!isWorkbookMistake(question) ? (
              <button type="button" className="btn secondary" onClick={() => removeFromMistakes(question.id)}>移出错题集</button>
            ) : <p className="muted">作业本上的错题会留在错题集里，学会了可以标成已掌握。</p>}
            <button type="button" className={data.mastered[question.id] ? "btn" : "btn secondary"} aria-pressed={Boolean(data.mastered[question.id])} onClick={() => setMastered(question.id, !data.mastered[question.id])}>
              {data.mastered[question.id] ? "已掌握" : "标记掌握"}
            </button>
            <NoteEditor questionId={question.id} />
          </div>
        )}
      </article>
      <nav className="pager">
        {prev ? <Link to={`/questions/${prev.id}`}>上一题</Link> : <span />}
        {next ? <Link to={`/questions/${next.id}`}>下一题</Link> : <span />}
      </nav>
    </div>
  );
}
