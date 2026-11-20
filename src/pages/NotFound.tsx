import { Link } from "react-router-dom";
import { useTitle } from "../components/Ui";

export function NotFound() {
  useTitle("找不到");
  return (
    <div className="page narrow" data-page="missing">
      <header className="page-head">
        <p className="eyebrow">走错了</p>
        <h1>这个页面不存在</h1>
        <p className="lede">题库、讲次和错题都还在。</p>
      </header>
      <Link className="btn" to="/">回首页</Link>
    </div>
  );
}
