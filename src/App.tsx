import { HashRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import HomePage from './components/HomePage';
import ChapterMapPage from './components/ChapterMapPage';
import ReadingPage from './components/ReadingPage';
import { firstPointOf, pointPath } from './data/courseNav';

// /ai/:chapterId 直接定位到该章首个知识点；章节不存在则回章节导览。
function ChapterRedirect() {
  const { chapterId } = useParams();
  const first = chapterId ? firstPointOf(chapterId) : undefined;
  return first ? <Navigate to={pointPath(first)} replace /> : <Navigate to="/ai" replace />;
}

function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <a className="skip-link" href="#main-content">
          跳到主要内容
        </a>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/ai" element={<ChapterMapPage />} />
          <Route path="/ai/:chapterId" element={<ChapterRedirect />} />
          <Route path="/ai/:chapterId/:pointId" element={<ReadingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;
