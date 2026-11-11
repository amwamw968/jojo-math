import { useMemo, useState } from "react";
import { questions } from "../data/catalog";
import {
  PROGRESS_LIMITS,
  applyProgress,
  exportProgress,
  inspectProgress,
  inspectProgressText,
  invalidProgress,
  progressEqual,
  type ConflictChoice,
  type ProgressAction,
  type ProgressPreview,
} from "../lib/progress-transfer";
import { todayStamp } from "../lib/text";
import { useUser } from "../lib/user";

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ProgressBackup() {
  const { data, reviews, storage, commitProgress, reset } = useUser();
  const [preview, setPreview] = useState<ProgressPreview | null>(null);
  const [dropUnknown, setDropUnknown] = useState(false);
  const [conflict, setConflict] = useState<ConflictChoice>("keep-local");
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [message, setMessage] = useState("");
  const catalogIds = useMemo(() => new Set(questions.map((question) => question.id)), []);
  const snapshot = useMemo(() => ({ practice: data, reviews }), [data, reviews]);
  const ready = Boolean(preview?.incoming && preview.errors.length === 0);
  const keepPlan = ready && preview ? applyProgress(snapshot, preview, { type: "merge", conflict: "keep-local", dropUnknown }, catalogIds) : null;
  const takePlan = ready && preview ? applyProgress(snapshot, preview, { type: "merge", conflict: "take-incoming", dropUnknown }, catalogIds) : null;
  const mergePlan = conflict === "keep-local" ? keepPlan : takePlan;
  const replacePlan = ready && preview ? applyProgress(snapshot, preview, { type: "replace", confirm: true, dropUnknown }, catalogIds) : null;
  const hasConflict = Boolean(keepPlan?.ok && takePlan?.ok && !progressEqual(keepPlan.next, takePlan.next));

  function clearPreview() {
    setPreview(null);
    setDropUnknown(false);
    setConflict("keep-local");
    setConfirmReplace(false);
  }

  function exportJson() {
    download(`jojo-progress-${todayStamp()}.json`, JSON.stringify(exportProgress(snapshot, new Date().toISOString()), null, 2));
  }

  function onFile(file: File) {
    setMessage("");
    setConfirmReplace(false);
    setDropUnknown(false);
    setConflict("keep-local");
    if (file.size > PROGRESS_LIMITS.maxTextChars) {
      setPreview(invalidProgress("文件太大。"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(inspectProgressText(String(reader.result), catalogIds));
    reader.onerror = () => setPreview(invalidProgress("这个文件没有读出来。本机记录没变。"));
    reader.readAsText(file, "utf-8");
  }

  function commit(action: Exclude<ProgressAction, { type: "cancel" }>) {
    if (!preview) return;
    const result = applyProgress(snapshot, preview, action, catalogIds);
    if (!result.ok) {
      setMessage(result.error ?? "没有写入。");
      return;
    }
    const error = commitProgress(result.next, result.recovery);
    if (error) {
      setMessage(error);
      return;
    }
    setMessage(action.type === "replace" ? "已按上面的说明覆盖，并留下恢复副本。" : "已合并到本机。");
    clearPreview();
  }

  return (
    <section className="manage no-print">
      <h2>备份</h2>
      <p className="muted">
        导出的是这台浏览器里的练习记录和复习评分，不包括题目文件里的作业本对错。导入会先检查类型、版本、题目和数量，看完会改什么再写入。取消或文件不合格时，什么都不会改。
      </p>
      <p className="muted">
        间隔复习的计算来自 ts-fsrs。许可全文在{" "}
        <a href={`${import.meta.env.BASE_URL}third-party/ts-fsrs-LICENSE.txt`}>ts-fsrs 许可</a>。
      </p>
      {message ? <p role="status">{message}</p> : null}
      <div className="row-actions">
        <button type="button" className="btn secondary" onClick={exportJson}>导出 JSON</button>
        <label className="btn secondary">导入 JSON
          <input
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onFile(file);
              event.target.value = "";
            }}
          />
        </label>
        {storage.recovery ? (
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              setMessage("这是覆盖或清空前留下的副本。还没写回。");
              setConfirmReplace(false);
              setDropUnknown(false);
              setConflict("keep-local");
              setPreview(inspectProgress(exportProgress(storage.recovery!, new Date().toISOString()), catalogIds));
            }}
          >
            查看恢复副本
          </button>
        ) : null}
        <button
          type="button"
          className="btn tiny secondary"
          disabled={storage.practiceBlocked || storage.reviewsBlocked}
          onClick={() => {
            if (!window.confirm("清空这台设备上的练习记录、笔记、掌握标记和复习评分？清空前会留一份恢复副本。")) return;
            const error = reset();
            setMessage(error ?? "已清空。恢复副本还在，可以再查看。");
          }}
        >
          清空本机记录
        </button>
      </div>
      {preview ? (
        <div className="preview-box" data-panel="import-preview">
          {preview.errors.length ? (
            <>
              <p>这份文件没有导入，本机记录没变。</p>
              <ul className="plain-list">
                {preview.errors.slice(0, 20).map((error, index) => <li key={`error-${index}`}>{error}</li>)}
              </ul>
              {preview.errors.length > 20 ? <p>还有 {preview.errors.length - 20} 条问题。</p> : null}
              <button type="button" className="btn secondary" onClick={clearPreview}>关闭</button>
            </>
          ) : (
            <>
              <p>还没写入。先看两种做法会变成什么样。</p>
              {preview.notes.map((note) => <p key={note}>{note}</p>)}
              {preview.unknownIds.length ? (
                <p>题库里没有这些题目：{preview.unknownIds.join("、")}。</p>
              ) : null}
              {preview.unknownIds.length ? (
                <label className="field">
                  <span><input type="checkbox" checked={dropUnknown} onChange={(event) => setDropUnknown(event.target.checked)} /> 跳过题库里没有的题目</span>
                </label>
              ) : null}
              {hasConflict ? (
                <fieldset className="choice-row">
                  <legend>遇到两边不一样的记录</legend>
                  <label><input type="radio" name="conflict" checked={conflict === "keep-local"} onChange={() => setConflict("keep-local")} /> 冲突时留着本机的</label>
                  <label><input type="radio" name="conflict" checked={conflict === "take-incoming"} onChange={() => setConflict("take-incoming")} /> 冲突时改用备份的</label>
                </fieldset>
              ) : null}
              <h3>如果合并</h3>
              {mergePlan?.ok ? (
                <ul className="plain-list">{mergePlan.effects.map((effect, index) => <li key={`merge-${index}`}>{effect}</li>)}</ul>
              ) : <p>{mergePlan?.error ?? "还不能合并。"}</p>}
              <h3>如果覆盖</h3>
              {replacePlan?.ok ? (
                <ul className="plain-list">{replacePlan.effects.map((effect, index) => <li key={`replace-${index}`}>{effect}</li>)}</ul>
              ) : <p>{replacePlan?.error ?? "还不能覆盖。"}</p>}
              <div className="row-actions">
                <button type="button" className="btn secondary" onClick={clearPreview}>取消</button>
                <button type="button" className="btn" disabled={!mergePlan?.ok} onClick={() => commit({ type: "merge", conflict, dropUnknown })}>合并到本机</button>
              </div>
              <label className="field">
                <span>
                  <input type="checkbox" checked={confirmReplace} onChange={(event) => setConfirmReplace(event.target.checked)} />
                  我确定用这份备份覆盖本机现在的记录
                </span>
              </label>
              <button type="button" className="btn secondary" disabled={!confirmReplace || !replacePlan?.ok} onClick={() => commit({ type: "replace", confirm: true, dropUnknown })}>
                覆盖本机
              </button>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
