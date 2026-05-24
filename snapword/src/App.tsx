import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { HomePage } from './routes/HomePage';
import { RecognizePage } from './routes/RecognizePage';
import { AnnotatePage } from './routes/AnnotatePage';
import { WordCardsPage } from './routes/WordCardsPage';
import { WordBookPage } from './routes/WordBookPage';
import { FavoritesPage } from './routes/FavoritesPage';
import { WordDetailPage } from './routes/WordDetailPage';
import { ReviewPage } from './routes/ReviewPage';
import { LoginPage } from './routes/LoginPage';
import { RegisterPage } from './routes/RegisterPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recognize" element={<RecognizePage />} />
          <Route path="/annotate/:sessionId" element={<AnnotatePage />} />
          <Route path="/cards/:sessionId" element={<WordCardsPage />} />
          <Route path="/wordbook" element={<WordBookPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/word/:cardId" element={<WordDetailPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
