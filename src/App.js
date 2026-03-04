import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import TopicsPage from './pages/TopicsPage';
import UploadPage from './pages/UploadPage';
import TopicDetailPage from './pages/TopicDetailPage';
import FlashcardsPage from './pages/FlashcardsPage';
import QuizPage from './pages/QuizPage';
import DiscussionPage from './pages/DiscussionPage';
import ReviewPage from './pages/ReviewPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<TopicsPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="topics/:id" element={<TopicDetailPage />} />
          <Route path="topics/:id/flashcards" element={<FlashcardsPage />} />
          <Route path="topics/:id/quiz" element={<QuizPage />} />
          <Route path="topics/:id/discuss" element={<DiscussionPage />} />
          <Route path="review" element={<ReviewPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
