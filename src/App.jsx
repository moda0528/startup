import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import Sessions from './components/Sessions.jsx';
import Chat from './components/Chat.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <header>
        <h1>StudyMatch</h1>

        <nav>
          <menu>
            <li><NavLink to="/">Home</NavLink></li>
            <li><NavLink to="/dashboard">Dashboard</NavLink></li>
            <li><NavLink to="/sessions">Sessions</NavLink></li>
            <li><NavLink to="/chat">Chat</NavLink></li>
          </menu>
        </nav>
        <hr />
      </header>

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>

      <footer>
        <hr />
        <span>Kyungju Jo</span>
        <br />
        <a href="https://github.com/moda0528/startup">
          GitHub
        </a>
      </footer>
    </BrowserRouter>
  );
}