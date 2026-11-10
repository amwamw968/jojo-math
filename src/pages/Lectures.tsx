import { Link } from "react-router-dom";
import { useTitle } from "../components/Ui";
import { questionsForLecture } from "../lib/lectures";
import { lectureLabel, tracks } from "../lib/syllabus-data";

export function Lectures() {
  useTitle("讲次");
  return (
    <div className="page">
      <header className="page-head">
        <h1>讲次</h1>
        <p>三门课分开排。只有已经核对过的讲次才写标题，其余标成待补。</p>
      </header>
      {tracks.map((track) => (
        <section key={track.id}>
          <h2>{track.title}</h2>
          {track.note ? <p className="muted">{track.note}</p> : null}
          <div className="book-grid">
            {track.lectures.map((lecture) => {
              const count = questionsForLecture(lecture).length;
              return (
                <Link key={lecture.id} to={`/lectures/${lecture.id}`} className="book-card">
                  <span className={lecture.status === "待补" ? "pill tone-amber" : "pill tone-green"}>{lecture.status}</span>
                  <h3>{lectureLabel(lecture)}</h3>
                  <p>{lecture.status === "已收录" ? `${count} 道题` : lecture.note}</p>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
