import { Link } from "react-router-dom";
import { useTitle } from "../components/Ui";

export function NotFound() {
  useTitle("找不到");
  return (
    <div className="page">
      <h1>这个页面不存在</h1>
      <Link to="/">回首页</Link>
    </div>
  );
}
