import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import Sessions from './components/Sessions.jsx';
import Chat from './components/Chat.jsx';
import { json, request } from './api.js';

export default function App() {
  const [user, setUser] = useState(null);
  const [myCourses, setMyCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState({});
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  const showError = (error) => setNotice(error.message || 'An unexpected error occurred.');

  const refreshSessions = useCallback(async () => {
    const result = await request('/sessions');
    setSessions(result.sessions);
  }, []);

  const loadMessages = useCallback(async (id) => {
    const result = await request(`/sessions/${encodeURIComponent(id)}/messages`);
    setMessages((current) => ({ ...current, [id]: result.messages }));
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      request('/auth/me').catch((error) => {
        if (error.message.includes('401') || error.message === 'Please log in first.') return null;
        throw error;
      }),
      request('/sessions'),
    ])
      .then(([account, sessionData]) => {
        if (!active) return;
        setUser(account?.user || null);
        setMyCourses(account?.courses || []);
        setSessions(sessionData.sessions);
      })
      .catch((error) => { if (active) setNotice(`Could not connect to backend: ${error.message}`); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // Refresh sessions periodically so changes from another browser appear.
  useEffect(() => {
    const timer = setInterval(() => refreshSessions().catch(() => {}), 15000);
    return () => clearInterval(timer);
  }, [refreshSessions]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  async function signIn({ name, email, password, create }) {
    try {
      const result = await json('POST', create ? '/auth/create' : '/auth/login', { name, email, password });
      setUser(result.user);
      setMyCourses(result.courses);
      setMessages({});
      setNotice(`Welcome, ${result.user.name}!`);
      return true;
    } catch (error) { showError(error); throw error; }
  }

  async function signOut() {
    try {
      await request('/auth/logout', { method: 'DELETE' });
      setUser(null);
      setMyCourses([]);
      setMessages({});
      setNotice('You have logged out.');
    } catch (error) { showError(error); throw error; }
  }

  async function addCourse(course) {
    try {
      const result = await json('POST', '/courses', { course });
      setMyCourses(result.courses);
      setNotice('Course saved to your account.');
    } catch (error) { showError(error); }
  }
  async function removeCourse(course) {
    try {
      const result = await request(`/courses/${encodeURIComponent(course)}`, { method: 'DELETE' });
      setMyCourses(result.courses);
    } catch (error) { showError(error); }
  }
  async function joinSession(id) {
    try {
      await request(`/sessions/${encodeURIComponent(id)}/join`, { method: 'POST' });
      await refreshSessions();
      setNotice('You joined the session! Open Chat to send a message.');
    } catch (error) { showError(error); }
  }
  async function createSession(payload) {
    try {
      await json('POST', '/sessions', payload);
      await refreshSessions();
      setNotice('New study session created.');
      return true;
    } catch (error) { showError(error); return false; }
  }
  async function leaveSession(id, isOwner) {
    try {
      await request(`/sessions/${encodeURIComponent(id)}${isOwner ? '' : '/leave'}`, {
        method: isOwner ? 'DELETE' : 'POST',
      });
      await refreshSessions();
      setNotice(isOwner ? 'Session deleted.' : 'You left the session.');
    } catch (error) { showError(error); }
  }
  async function sendMessage(id, text) {
    try {
      await json('POST', `/sessions/${encodeURIComponent(id)}/messages`, { text });
      await loadMessages(id);
      return true;
    } catch (error) { showError(error); return false; }
  }

  return (
    <BrowserRouter>
      <header>
        <h1>StudyMatch</h1>
        <nav aria-label="Main navigation">
          <menu>
            <li><NavLink to="/">Home</NavLink></li>
            <li><NavLink to="/dashboard">Dashboard</NavLink></li>
            <li><NavLink to="/sessions">Sessions</NavLink></li>
            <li><NavLink to="/chat">Chat</NavLink></li>
          </menu>
        </nav>
        {user && <div className="header-account"><span>Hi, {user.name}!</span><LogoutButton onLogout={signOut} /></div>}
      </header>
      {notice && <div role="status" className="notice">{notice}</div>}
      {loading ? <main><p>Connecting to StudyMatch service…</p></main> : (
        <Routes>
          <Route path="/" element={<Login user={user} onLogin={signIn} />} />
          <Route path="/dashboard" element={
            <Dashboard user={user} sessions={sessions} myCourses={myCourses}
              onJoin={joinSession} onAddCourse={addCourse} onRemoveCourse={removeCourse} />
          } />
          <Route path="/sessions" element={
            <Sessions user={user} sessions={sessions} onCreate={createSession} onLeave={leaveSession} />
          } />
          <Route path="/chat" element={
            <Chat user={user} sessions={sessions} messages={messages}
              onSend={sendMessage} onLoadMessages={loadMessages} />
          } />
          <Route path="*" element={<main><h2>Page not found</h2><NavLink to="/">Return home</NavLink></main>} />
        </Routes>
      )}
      <footer>
        <hr />
        <span>Kyungju Jo</span><br />
        <a href="https://github.com/moda0528/startup" target="_blank" rel="noreferrer">GitHub repository</a>
        <p className="demo-note">Accounts, courses, study sessions, and messages are handled by the Express server. Records reset if the service restarts; the database comes later.</p>
      </footer>
    </BrowserRouter>
  );
}

function LogoutButton({ onLogout }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try { await onLogout(); navigate('/'); } finally { setBusy(false); }
  }
  return <button type="button" className="btn btn-outline-secondary btn-sm" disabled={busy} onClick={logout}>Log out</button>;
}
