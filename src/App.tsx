import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { KnowledgeDetail } from "./pages/KnowledgeDetail";
import { KnowledgeList } from "./pages/KnowledgeList";
import { LectureDetail } from "./pages/LectureDetail";
import { Lectures } from "./pages/Lectures";
import { Mistakes } from "./pages/Mistakes";
import { MistakesPrint } from "./pages/MistakesPrint";
import { NotFound } from "./pages/NotFound";
import { Practice } from "./pages/Practice";
import { QuestionDetail } from "./pages/QuestionDetail";
import { Questions } from "./pages/Questions";
import { Review } from "./pages/Review";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="lectures" element={<Lectures />} />
        <Route path="lectures/:id" element={<LectureDetail />} />
        <Route path="questions" element={<Questions />} />
        <Route path="questions/:id" element={<QuestionDetail />} />
        <Route path="practice" element={<Practice />} />
        <Route path="review" element={<Review />} />
        <Route path="mistakes" element={<Mistakes />} />
        <Route path="knowledge" element={<KnowledgeList />} />
        <Route path="knowledge/:id" element={<KnowledgeDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="mistakes/print" element={<MistakesPrint />} />
    </Routes>
  );
}
