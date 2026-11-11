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

export function StorageBanner() {
  const { storage, discardCorrupt } = useUser();
  if (!storage.practiceBlocked && !storage.reviewsBlocked && !storage.writeError && !storage.recoveryError) return null;
  return (
    <div className="banner no-print" role="status">
      {storage.practiceError ? <p>{storage.practiceError} 没有用空白记录覆盖。</p> : null}
      {storage.reviewsError ? <p>{storage.reviewsError} 没有用空白记录覆盖。</p> : null}
      {storage.writeError ? <p>{storage.writeError} 刷新后会回到上次成功保存的内容，可以先导出现在页面上的记录。</p> : null}
      {storage.recoveryError ? <p>{storage.recoveryError}</p> : null}
      <div className="row-actions">
        {storage.practiceRaw ? (
          <button type="button" className="btn tiny secondary" onClick={() => download("jojo-unreadable-practice.json", storage.practiceRaw ?? "")}>
            下载读不出来的练习记录
          </button>
        ) : null}
        {storage.reviewsRaw ? (
          <button type="button" className="btn tiny secondary" onClick={() => download("jojo-unreadable-reviews.json", storage.reviewsRaw ?? "")}>
            下载读不出来的复习评分
          </button>
        ) : null}
        {storage.practiceBlocked ? (
          <button
            type="button"
            className="btn tiny secondary"
            onClick={() => {
              if (window.confirm("用空白替换读不出来的练习记录？原文如果还没下载，替换后就没有了。")) discardCorrupt("practice");
            }}
          >
            确认用空白替换练习记录
          </button>
        ) : null}
        {storage.reviewsBlocked ? (
          <button
            type="button"
            className="btn tiny secondary"
            onClick={() => {
              if (window.confirm("用空白替换读不出来的复习评分？原文如果还没下载，替换后就没有了。")) discardCorrupt("reviews");
            }}
          >
            确认用空白替换复习评分
          </button>
        ) : null}
      </div>
    </div>
  );
}
