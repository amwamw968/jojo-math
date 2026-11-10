import { useEffect, useState } from "react";
import { useUser } from "../lib/user";

export function NoteEditor({ questionId }: { questionId: string }) {
  const { data, setNote } = useUser();
  const stored = data.notes[questionId] ?? "";
  const [text, setText] = useState(stored);

  useEffect(() => {
    setText(stored);
  }, [questionId, stored]);

  useEffect(() => {
    if (text === stored) return;
    const timer = window.setTimeout(() => setNote(questionId, text), 400);
    return () => window.clearTimeout(timer);
  }, [text, stored, questionId, setNote]);

  return (
    <label className="note-editor">
      <span>复习笔记</span>
      <textarea
        value={text}
        maxLength={2000}
        rows={3}
        placeholder="复习时想记住的话，写在这里。只存在这台设备上。"
        onChange={(event) => setText(event.target.value)}
      />
    </label>
  );
}
