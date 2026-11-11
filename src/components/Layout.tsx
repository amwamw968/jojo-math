import { NavLink, Outlet } from "react-router-dom";
import { questions } from "../data/catalog";
import { PRODUCT_NAME } from "../lib/constants";
import { isMistake } from "../lib/mistakes";
import { useUser } from "../lib/user";
import { StorageBanner } from "./StorageBanner";
import { AlertIcon, BookIcon, BulbIcon, Fox, HomeIcon, ListIcon, PencilIcon } from "./Icons";

const NAV = [
  { to: "/", label: "首页", short: "首页", icon: HomeIcon, end: true },
  { to: "/lectures", label: "讲次", short: "讲次", icon: ListIcon, end: false },
  { to: "/questions", label: "题库", short: "题库", icon: BookIcon, end: false },
  { to: "/practice", label: "练习", short: "练习", icon: PencilIcon, end: false },
  { to: "/mistakes", label: "错题", short: "错题", icon: AlertIcon, end: false },
  { to: "/knowledge", label: "知识点", short: "知识", icon: BulbIcon, end: false },
];

export function Layout() {
  const { data } = useUser();
  const todo = questions.filter((question) => isMistake(question, data) && !data.mastered[question.id]).length;

  return (
    <div className="app" data-app="jojo-math">
      <aside className="sidebar">
        <NavLink to="/" className="brand" end>
          <Fox size={46} />
          <span>
            <strong>{PRODUCT_NAME}</strong>
            <small>四年级 · 自己的练习本</small>
          </span>
        </NavLink>
        <nav className="side-nav" aria-label="主导航">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <item.icon />
              <span>{item.label}</span>
              {item.to === "/mistakes" && todo > 0 ? <em className="nav-badge">{todo}</em> : null}
            </NavLink>
          ))}
        </nav>
        <p className="sidebar-foot">题目在仓库的文件里。练习和复习评分记在这台设备上，可以导出备份。</p>
      </aside>

      <div className="main">
        <header className="topbar">
          <NavLink to="/" className="brand compact" end>
            <Fox size={36} />
            <strong>{PRODUCT_NAME}</strong>
          </NavLink>
        </header>
        <StorageBanner />
        <Outlet />
      </div>

      <nav className="bottom-nav" aria-label="主导航">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? "tab active" : "tab")}>
            <item.icon />
            <span>{item.short}</span>
            {item.to === "/mistakes" && todo > 0 ? <em className="tab-badge">{todo}</em> : null}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
