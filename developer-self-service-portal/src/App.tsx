import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import ActionsPage from './pages/ActionsPage';
import SettingsPage from './pages/SettingsPage';
import WrapperCreationPage from './pages/WrapperCreationPage';

// Placeholder components - these will be implemented in future tasks
const Home = () => <div>Developer Self-Service Portal Home</div>;
const HistoryPage = () => <div>Execution History</div>;

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <h1>Developer Self-Service Portal</h1>
          <nav>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/actions">Actions</Link></li>
              <li><Link to="/create-wrapper">Create Wrapper</Link></li>
              <li><Link to="/history">History</Link></li>
              <li><Link to="/settings">Settings</Link></li>
            </ul>
          </nav>
        </header>
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/actions" element={<ActionsPage />} />
            <Route path="/create-wrapper" element={<WrapperCreationPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <p>Developer Self-Service Portal - A better way to use GitHub Actions</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
