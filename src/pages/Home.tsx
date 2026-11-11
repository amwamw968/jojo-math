import { Link } from "react-router-dom";
import { bookShort, books, knowledgeDocs, questions } from "../data/catalog";
import { isMistake, knowledgeStats, recentMistakes, workbookNote } from "../lib/mistakes";
import { lectureOfQuestion } from "../lib/lectures";
import { tracks } from "../lib/syllabus-data";
import { MathText } from "../components/MathText";
import { formatWhen } from "../lib/text";
import { useUser } from "../lib/user";
import { useTitle } from "../components/Ui";
import { Fox } from "../components/Icons";

export function Home() {
  useTitle("首页");
  const { data, due } = useUser();
  const mistakes = questions.filter((question) => isMistake(question, data));
  const todo = mistakes.filter((question) => !data.mastered[question.id]);
  const practiced = questions.filter((question) => data.practice[question.id] === "会了").length;
  const recent = recentMistakes(questions, data);
  const stats = knowledgeStats(questions, data, knowledgeDocs);
  const notes = questions.filter((question) => workbookNote(question));
  const greeting = todo.length === 0
    ? "错题都看过啦。想练的时候，从这一讲再出几道变式。"
    : todo.length === 1
      ? "有 1 道题还要再看一看。"
      : `有 ${todo.length} 道题还要再看一看。`;

  return (
    <div className="page" data-page="home">
      <header className="hero">
        <Fox size={72} />
        <div>
          <p className="eyebrow">高思四年级秋季 · 冠军请听题</p>
          <h1>你好，Jojo</h1>
          <p className="lede">{greeting}</p>
        </div>
      </header>

      <section className="stats">
        <Link to="/questions" className="stat"><strong>{questions.length}</strong><span>题库</span></Link>
        <Link to="/mistakes" className="stat"><strong>{todo.length}</strong><span>待复习</span></Link>
        <Link to="/knowledge" className="stat"><strong>{knowledgeDocs.length}</strong><span>知识点</span></Link>
        <Link to="/practice" className="stat"><strong>{practiced}</strong><span>会了</span></Link>
      </section>

      <section className="jump">
        <Link to="/practice" className="btn">开始练习</Link>
        <Link to="/lectures/gs-autumn-4-l01" className="btn secondary">第 1 讲</Link>
        <Link to="/mistakes/print" className="btn secondary">打印错题</Link>
      </section>
      {due.length > 0 ? <p><Link to="/review">今天有 {due.length} 道到了复习时间</Link></p> : null}
      {data.practiceLog.length > 0 ? (
        <section>
          <h2>最近练习</h2>
          <ul className="plain-list">
            {[...data.practiceLog].reverse().slice(0, 5).map((entry) => {
              const item = questions.find((question) => question.id === entry.questionId);
              return (
                <li key={entry.id}>
                  <Link to={item ? `/questions/${entry.questionId}` : "/practice"}>
                    <strong>{entry.outcome}</strong>
                    <span> {item ? `${bookShort(item.book)} · ${item.lesson}` : entry.questionId} · {formatWhen(entry.at)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="split">
        <div>
          <h2>最近的错题</h2>
          {recent.length === 0 ? <p className="muted">作业本上还没有错题。练习时点「不会」，也会出现在这里。</p> : (
            <ul className="plain-list">
              {recent.map((question) => (
                <li key={question.id}>
                  <Link to={`/questions/${question.id}`}>
                    <strong>{bookShort(question.book)}</strong>
                    <MathText>{question.stem}</MathText>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <h2>作业本批注</h2>
          <p className="muted">做对了也可能有一句批注，这些题不会自动进错题集。</p>
          <ul className="plain-list">
            {notes.map((question) => (
              <li key={question.id}>
                <Link to={`/questions/${question.id}`}>
                  <strong>{bookShort(question.book)} · {question.jojo?.status === "partial" ? "部分对" : "做对了"}</strong>
                  <MathText>{workbookNote(question)}</MathText>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2>知识点掌握</h2>
          <ul className="kp-bars">
            {stats.map((item) => (
              <li key={item.id}>
                <div className="kp-bar-label">
                  <Link to={`/knowledge/${item.id}`}>{item.title}</Link>
                  <span>{item.unmastered > 0 ? `${item.unmastered} 道待复习` : "暂无错题"} / {item.total}</span>
                </div>
                <div className="bar" aria-hidden="true">
                  <span style={{ width: item.total ? `${Math.max(item.unmastered > 0 ? 8 : 0, (item.unmastered / item.total) * 100)}%` : "0%" }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <h2>三门课</h2>
      <div className="book-grid">
        {tracks.map((track) => {
          const ready = track.lectures.filter((lecture) => lecture.status === "已收录");
          return (
            <Link key={track.id} to="/lectures" className="book-card">
              <span className="pill tone-green">{track.publisher}</span>
              <h3>{track.title}</h3>
              <p>{ready.length > 0 ? ready.map((lecture) => lecture.title).join("、") : "讲次待补"}</p>
            </Link>
          );
        })}
      </div>

      <h2>收录的书</h2>
      <div className="book-grid">
        {books.map((book) => {
          const own = questions.filter((question) => question.book === book.id);
          const lecture = own[0] ? lectureOfQuestion(own[0]) : undefined;
          return (
            <Link key={book.id} to={`/questions?book=${book.id}`} className={`book-card tone-${book.id.endsWith("-dp") ? "daily" : book.id.endsWith("-hw") ? "hw" : "book"}`}>
              <span className="pill">{bookShort(book.id)}</span>
              <h3>{book.title}</h3>
              <p>{own.length} 道 · {book.grade} 年级 · {book.term}</p>
              {lecture?.title ? <p>对应 {lecture.number ? `第 ${lecture.number} 讲 ` : ""}{lecture.title}</p> : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
