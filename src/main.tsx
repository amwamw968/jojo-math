import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "katex/dist/katex.min.css";
import { App } from "./App";
import { UserProvider } from "./lib/user";
import "./index.css";

const base = import.meta.env.BASE_URL;
const basename = base === "/" ? undefined : base.replace(/\/$/, "");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UserProvider>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </UserProvider>
  </StrictMode>,
);
