import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import DashboardPage from './pages/DashboardPage';
import HearingTestPage from './pages/HearingTestPage';
import LoginPage from './pages/LoginPage';
import ResultsPage from './pages/ResultsPage';
import SettingsPage from './pages/SettingsPage';
import SpeechTestPage from './pages/SpeechTestPage';
import SoundLocalizationTestPage from './pages/SoundLocalizationTestPage';
import LegacyUiPage from './pages/LegacyUiPage';

function App() {
  const location = useLocation();
  const hideNav = location.pathname === '/login';

  return (
    <div className="min-h-screen text-onsurface">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.35 }}
          className="min-h-screen"
        >
          <Routes location={location}>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/hearing-test" element={<HearingTestPage />} />
            <Route path="/3d-sound-test" element={<SoundLocalizationTestPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/speech-test" element={<SpeechTestPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/legacy" element={<LegacyUiPage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      {!hideNav && <BottomNav />}
    </div>
  );
}

export default App;
