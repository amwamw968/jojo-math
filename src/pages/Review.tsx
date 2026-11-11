import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MathText } from "../components/MathText";
import { StatusPill, useTitle } from "../components/Ui";
import { bookShort, questionById, questions } from "../data/catalog";
import { isMistake } from "../lib/mistakes";
import { REVIEW_RATING_LABEL, type ReviewRating } from "../lib/review-schedule";
import { figureUrl, formatWhen } from "../lib/text";
import { useUser } from "../lib/user";

const RATINGS: ReviewRating[] = [1, 2, 3, 4];

export function Review() {
  useTitle("间隔复习");
  const [params] = useSearchParams();
  const id = params.get("id") ?? "";
  const { data, schedule, due, storage, rateReview } = useUser();
  const [showAnswer, setShowAnswer] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const question = id ? questionById.get(id) : undefined;

  useEffect(() => {
    setShowAnswer(false);
    setSaved(false);
    setMessage("");
  }, [id]);

  const later = schedule.filter((item) => !due.some((dueItem) => dueItem.questionId === item.questionId));
  const unscheduled = questions.filter((item) => isMistake(item, data) && !schedule.some((card) => card.questionId === item.id)).slice(0, 12);

  function rate(rating: ReviewRating) {
    if (!question) return;
    const result = rateReview(question.id, rating);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setSaved(true);
    setMessage(`已记下「${REVIEW_RATING_LABEL[rating]}」。下次到期 ${formatWhen(result.due)}。这只在这台浏览器，作业本上的对错没有改。`);
  }

  return (
    <div className="page narrow" data-page="review">
      <header className="page-head">
        <h1>间隔复习</h1>
        <p>
          看完答案后，自己选没记住、有点难、记住了或很熟。这四项对应 Again、Hard、Good、Easy，用来算下次什么时候再看。
          作业本上的对错写在题目文件里，这里不会改，也不会上传。点练习里的「会了」也不会自动变成「记住了」。错题集里标成已掌握，也不会抹掉这里的到期日。
        </p>
        <p className="muted">
          周日在讲次页用同一个种子重印变式，那是另一份纸，不读这张到期表。评分另外记在这台浏览器里。
          <a href={`${import.meta.env.BASE_URL}third-party/ts-fsrs-LICENSE.txt`}> ts-fsrs 许可</a>
        </p>
      </header>

      <section data-section="due-reviews">
        <h2>今天到期</h2>
        {due.length === 0 ? <p className="muted">今天没有到期限的复习。还没评过分的错题不会自动排进来。</p> : (
          <ul className="plain-list">
            {due.map((item) => {
              const card = questionById.get(item.questionId);
              return (
                <li key={item.questionId}>
                  <Link to={`/review?id=${item.questionId}`}>
                    {card ? `${bookShort(card.book)} · ${card.lesson}` : item.questionId}
                    <span className="muted"> {item.questionId} · {REVIEW_RATING_LABEL[item.lastRating]}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {question ? (
        <article className="article">
          <p className="page-no">{bookShort(question.book)} · {question.lesson} · {question.id}</p>
          {question.jojo ? <p><StatusPill status={question.jojo.status} /></p> : <p className="muted">作业本上没有这道题的作答记录。</p>}
          <div className="stem-block"><MathText flow="stem">{question.stem}</MathText></div>
          {question.figure ? <figure className="figure"><img src={figureUrl(question.figure)} alt="" /></figure> : null}
          <button type="button" className="reveal-toggle" aria-expanded={showAnswer} onClick={() => setShowAnswer((value) => !value)}>
            {showAnswer ? "收起答案" : "点一点，看答案"}
          </button>
          {showAnswer ? (
            <div className="reveal-body">
              <MathText>{question.answer}</MathText>
              {question.solution ? <MathText>{question.solution}</MathText> : null}
            </div>
          ) : null}
          <p className="muted">先看答案，再评分。评分不会改上面的作业本状态。</p>
          <div className="choice-row">
            {RATINGS.map((rating) => (
              <button
                key={rating}
                type="button"
                className={`choice ${rating === 1 ? "again" : rating === 2 ? "hard" : rating === 4 ? "easy" : "good"}`}
                disabled={!showAnswer || saved || storage.reviewsBlocked}
                onClick={() => rate(rating)}
              >
                {REVIEW_RATING_LABEL[rating]}
              </button>
            ))}
          </div>
          {saved ? <button type="button" className="btn tiny secondary" onClick={() => { setSaved(false); setMessage(""); }}>再评一次</button> : null}
          {message ? <p role="status">{message}</p> : null}
        </article>
      ) : id ? <p>题库里没有这道题。</p> : null}

      <section data-section="scheduled">
        <h2>已经排期、还没到期</h2>
        {later.length === 0 ? <p className="muted">还没有排到以后的题。</p> : (
          <ul className="plain-list">
            {later.slice(0, 12).map((item) => {
              const card = questionById.get(item.questionId);
              return (
                <li key={item.questionId}>
                  <Link to={`/review?id=${item.questionId}`}>
                    {card ? `${bookShort(card.book)} · ${card.lesson}` : item.questionId}
                    <span className="muted"> {item.questionId} · 到期 {formatWhen(item.due)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {unscheduled.length ? (
        <section>
          <h2>错题里还没评分的</h2>
          <ul className="plain-list">
            {unscheduled.map((item) => (
              <li key={item.id}><Link to={`/review?id=${item.id}`}>{bookShort(item.book)} · {item.lesson}</Link></li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
