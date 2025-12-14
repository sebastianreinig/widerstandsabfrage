import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import CreateRound from './pages/CreateRound';
import Voting from './pages/Voting';
import HostView from './pages/HostView';
import AdminDashboard from './pages/AdminDashboard';
import { LanguageProvider, useTranslation } from './i18n';

function AppContent() {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const { toggleLang, lang } = useTranslation();

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <Router>
            <div className="app-wrapper">
                <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 1000, display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary btn-icon" onClick={toggleLang} style={{ fontSize: '1.5rem', padding: '0.25rem 0.5rem' }}>
                        {lang === 'de' ? '🇬🇧' : '🇩🇪'}
                    </button>
                    <button className="btn btn-secondary btn-icon" onClick={toggleTheme} style={{ borderRadius: '50%' }}>
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                </div>
                <Routes>
                    <Route path="/" element={<CreateRound />} />
                    <Route path="/rounds/:roundId" element={<Voting />} />
                    <Route path="/rounds/:roundId/results" element={<HostView />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                </Routes>
            </div>
        </Router>
    );
}

function App() {
    return (
        <LanguageProvider>
            <AppContent />
        </LanguageProvider>
    );
}

export default App;
