import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Placeholder components - these will be implemented in future tasks
const Home = () => <div>Developer Self-Service Portal Home</div>;
const ConfigPage = () => <div>GitHub Token Configuration</div>;
const ActionsPage = () => <div>GitHub Actions Catalog</div>;
const HistoryPage = () => <div>Execution History</div>;

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <h1>Developer Self-Service Portal</h1>
          <nav>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/actions">Actions</a></li>
              <li><a href="/history">History</a></li>
              <li><a href="/config">Configuration</a></li>
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
