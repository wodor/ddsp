import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import GitHubTokenForm from './components/GitHubTokenForm';
import ActionsPage from './pages/ActionsPage';

// Placeholder components - these will be implemented in future tasks
const Home = () => <div>Developer Self-Service Portal Home</div>;
const ConfigPage = () => <GitHubTokenForm />;
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
              <li><Link to="/history">History</Link></li>
              <li><Link to="/config">Configuration</Link></li>
            </ul>
          </nav>
        </header>
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/actions" element={<ActionsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/config" element={<ConfigPage />} />
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
