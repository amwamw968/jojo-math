import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { QuestionCard } from "../components/QuestionCard";
import { EmptyNote, useTitle } from "../components/Ui";
import { bookShort, books, chapterOptions, knowledgeDocs, questions } from "../data/catalog";
import { EMPTY_FILTERS, filterQuestions, groupByLesson, type QuestionFilters } from "../lib/filter";
import { QUESTION_TYPES } from "../lib/constants";

export function Questions() {
  useTitle("题库");
  const [params, setParams] = useSearchParams();
  const filters: QuestionFilters = {
    book: params.get("book") ?? "",
    chapter: params.get("chapter") ?? "",
    lesson: params.get("lesson") ?? "",
    kp: params.get("kp") ?? "",
    type: params.get("type") ?? "",
    difficulty: params.get("difficulty") ?? "",
    jojo: params.get("jojo") ?? "",
    q: params.get("q") ?? "",
  };

  function update(patch: Partial<QuestionFilters>) {
    const next = { ...filters, ...patch };
    if (patch.book !== undefined && patch.book !== filters.book) {
      next.chapter = "";
      next.lesson = "";
    }
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value) search.set(key, value);
    }
    setParams(search, { replace: true });
  }

  const chapters = useMemo(() => {
    const names = new Map<string, string[]>();
    for (const option of chapterOptions(filters.book)) {
      const name = option.title.replace(/^\d{2}\s/, "");
      const list = names.get(option.id) ?? [];
      if (!list.includes(name)) list.push(name);
      names.set(option.id, list);
    }
    return [...names.entries()].map(([id, list]) => ({ id, title: `${id} ${list.join(" / ")}` }));
  }, [filters.book]);

  const lessons = useMemo(() => {
    const seen: string[] = [];
    for (const question of questions) {
      if (filters.book && question.book !== filters.book) continue;
      if (filters.chapter && question.chapter !== filters.chapter) continue;
      if (question.lesson && !seen.includes(question.lesson)) seen.push(question.lesson);
    }
    return seen;
  }, [filters.book, filters.chapter]);

  const list = filterQuestions(questions, filters);
  const groups = groupByLesson(list);
  const active = Object.values(filters).some(Boolean);
  const [text, setText] = useState(filters.q);
  const extraActive = Boolean(filters.chapter || filters.lesson || filters.kp || filters.difficulty || filters.jojo);
  const [extraOpen, setExtraOpen] = useState(extraActive);
  useEffect(() => {
    if (extraActive) setExtraOpen(true);
  }, [extraActive]);

  return (
    <div className="page" data-page="questions">
      <header className="page-head">
        <h1>题库</h1>
        <p className="lede">共 <span aria-live="polite">{list.length}</span> 道。可以按书、章节、知识点、题型和难度找题。</p>
      </header>
      <div className="filters">
        <div className="filter-row">
          <div className="chips" role="group" aria-label="书">
            <button type="button" className={!filters.book ? "chip on" : "chip"} aria-pressed={!filters.book} onClick={() => update({ book: "" })}>全部</button>
            {books.map((book) => (
              <button key={book.id} type="button" className={filters.book === book.id ? "chip on" : "chip"} aria-pressed={filters.book === book.id} onClick={() => update({ book: book.id })}>
                {bookShort(book.id)}
              </button>
            ))}
          </div>
          <label className="search-label">
            搜索
            <input
              className="search"
              type="search"
              placeholder="题目、标签，例如 任务3 或 同题"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                update({ q: event.target.value });
              }}
            />
          </label>
        </div>
        <div className="chips" role="group" aria-label="题型">
          <button type="button" className={!filters.type ? "chip on" : "chip"} aria-pressed={!filters.type} onClick={() => update({ type: "" })}>全部题型</button>
          {QUESTION_TYPES.map((type) => (
            <button key={type} type="button" className={filters.type === type ? "chip on" : "chip"} aria-pressed={filters.type === type} onClick={() => update({ type })}>{type}</button>
          ))}
        </div>
        <button
          type="button"
          className="btn secondary filter-more"
          aria-expanded={extraOpen}
          aria-controls="more-filters"
          onClick={() => setExtraOpen((open) => !open)}
        >
          {extraOpen ? "收起筛选" : "更多筛选"}
        </button>
        <div id="more-filters" className={extraOpen ? "filter-extra open" : "filter-extra"}>
        <div className="filter-grid">
          <label>章节
            <select value={filters.chapter} onChange={(event) => update({ chapter: event.target.value, lesson: "" })}>
              <option value="">全部</option>
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
              ))}
            </select>
          </label>
          <label>活动
            <select value={filters.lesson} onChange={(event) => update({ lesson: event.target.value })}>
              <option value="">全部</option>
              {lessons.map((lesson) => <option key={lesson} value={lesson}>{lesson}</option>)}
            </select>
          </label>
          <label>知识点
            <select value={filters.kp} onChange={(event) => update({ kp: event.target.value })}>
              <option value="">全部</option>
              {knowledgeDocs.map((doc) => <option key={doc.id} value={doc.id}>{doc.title}</option>)}
            </select>
          </label>
          <label>难度
            <select value={filters.difficulty} onChange={(event) => update({ difficulty: event.target.value })}>
              <option value="">全部</option>
              {[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
          </label>
          <label>作业本
            <select value={filters.jojo} onChange={(event) => update({ jojo: event.target.value })}>
              <option value="">全部</option>
              <option value="partial">部分对</option>
              <option value="wrong">做错了</option>
              <option value="correct">做对了</option>
              <option value="note">有批注</option>
              <option value="none">没有记录</option>
            </select>
          </label>
        </div>
        </div>
        {active ? <button type="button" className="btn tiny secondary" onClick={() => { setText(""); update(EMPTY_FILTERS); }}>清除筛选</button> : null}
      </div>
      {groups.length === 0 ? <EmptyNote>没有符合的题目。</EmptyNote> : groups.map((group) => (
        <section key={group.key} className="lesson-group">
          <h2>{bookShort(group.bookId)} · {group.lesson}</h2>
          <div className="q-grid">
            {group.questions.map((question) => <QuestionCard key={question.id} question={question} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
