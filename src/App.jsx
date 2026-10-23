import { useEffect, useState } from 'react';
import { BrowserRouter, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import Sessions from './components/Sessions.jsx';
import Chat from './components/Chat.jsx';
import { loadState, makeId, saveState } from './data.js';

export default function App() {
  const [data, setData] = useState(loadState);
  const [notice, setNotice] = useState('');

  // Save users, sessions, memberships, and messages after each change.
  useEffect(() => {
    saveState(data);
  }, [data]);

  // Auto-dismiss status messages; the cleanup prevents stale timers.
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const user = data.user;
  const myCourses = user ? data.coursesByUser[user.email] || [] : [];

  function signIn({ name, email, create }) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = data.accounts[normalizedEmail];
    const account = existing || {
      email: normalizedEmail,
      name: name.trim() || normalizedEmail.split('@')[0],
    };
    // Mock authentication: passwords are never saved or verified.
    setData((previous) => ({
      ...previous,
      user: account,
      accounts: { ...previous.accounts, [normalizedEmail]: account },
    }));
    setNotice(create ? `Demo account ready. Welcome, ${account.name}!` : `Welcome back, ${account.name}!`);
  }

  function signOut() {
    setData((previous) => ({ ...previous, user: null }));
    setNotice('You signed out of the demo.');
  }

  function addCourse(course) {
    if (!user) return;
    const normalized = course.trim().toUpperCase();
    if (!normalized) return;
    setData((previous) => {
      const previousCourses = previous.coursesByUser[user.email] || [];
      if (previousCourses.includes(normalized)) return previous;
      return {
        ...previous,
        coursesByUser: {
          ...previous.coursesByUser,
          [user.email]: [...previousCourses, normalized],
        },
      };
    });
  }

  function removeCourse(course) {
    if (!user) return;
    setData((previous) => ({
      ...previous,
      coursesByUser: {
        ...previous.coursesByUser,
        [user.email]: (previous.coursesByUser[user.email] || []).filter((item) => item !== course),
      },
    }));
  }

  function joinSession(id) {
    if (!user) {
      setNotice('Log in on the Home page before joining a session.');
      return;
    }
    const session = data.sessions.find((item) => item.id === id);
    if (!session) return;
    if (session.members.includes(user.email)) {
      setNotice('You are already in this study session.');
      return;
    }
    if (session.members.length >= session.maxStudents) {
      setNotice('This session is full.');
      return;
    }
    setData((previous) => ({
      ...previous,
      sessions: previous.sessions.map((item) => item.id === id
        ? { ...item, members: [...item.members, user.email] }
        : item),
    }));
    setNotice('You joined the study session. Open Chat to send a message!');
  }

  function createSession({ course, date, time, location, maxStudents }) {
    if (!user) {
      setNotice('Log in before creating a session.');
      return;
    }
    const session = {
      id: makeId(), course: course.trim(), date, time,
      location: location.trim(), maxStudents: Number(maxStudents),
      members: [user.email], createdBy: user.email,
    };
    setData((previous) => ({ ...previous, sessions: [...previous.sessions, session] }));
    setNotice('Study session created! You are its first member.');
  }

  function leaveSession(id) {
    if (!user) return;
    setData((previous) => {
      const session = previous.sessions.find((item) => item.id === id);
      if (!session) return previous;
      if (session.createdBy === user.email) {
        const { [id]: deletedMessages, ...remainingMessages } = previous.messages;
        return {
          ...previous,
          sessions: previous.sessions.filter((item) => item.id !== id),
          messages: remainingMessages,
        };
      }
      return {
        ...previous,
        sessions: previous.sessions.map((item) => item.id === id
          ? { ...item, members: item.members.filter((email) => email !== user.email) }
          : item),
      };
    });
    const original = data.sessions.find((item) => item.id === id);
    setNotice(original?.createdBy === user.email ? 'You deleted your session.' : 'You left the session.');
  }

  function appendMessage(sessionId, from, text) {
    const cleanText = text.trim();
    if (!cleanText) return;
    const message = { id: makeId(), from, text: cleanText.slice(0, 500), time: new Date().toISOString() };
    setData((previous) => {
      if (!previous.sessions.some((session) => session.id === sessionId)) return previous;
      return {
        ...previous,
        messages: {
          ...previous.messages,
          [sessionId]: [...(previous.messages[sessionId] || []), message],
        },
      };
    });
  }

  function sendMessage(sessionId, text) {
    const session = data.sessions.find((item) => item.id === sessionId);
    if (!user || !session?.members.includes(user.email)) return;
    appendMessage(sessionId, user.email, text);
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

      <Routes>
        <Route path="/" element={<Login user={user} onLogin={signIn} />} />
        <Route path="/dashboard" element={
          <Dashboard user={user} sessions={data.sessions} myCourses={myCourses}
            onJoin={joinSession} onAddCourse={addCourse} onRemoveCourse={removeCourse} />
        } />
        <Route path="/sessions" element={
          <Sessions user={user} sessions={data.sessions} onCreate={createSession} onLeave={leaveSession} />
        } />
        <Route path="/chat" element={
          <Chat user={user} sessions={data.sessions} messages={data.messages}
            onSend={sendMessage} onSimulatedMessage={appendMessage} />
        } />
        <Route path="*" element={<main><h2>Page not found</h2><NavLink to="/">Return home</NavLink></main>} />
      </Routes>

      <footer>
        <hr />
        <span>Kyungju Jo</span>
        <br />
        <a href="https://github.com/moda0528/startup" target="_blank" rel="noreferrer">GitHub repository</a>
        <p className="demo-note">StudyMatch demo: data is saved only in your browser. No real accounts or server chat yet.</p>
      </footer>
    </BrowserRouter>
  );
}

function LogoutButton({ onLogout }) {
  const navigate = useNavigate();
  return <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => { onLogout(); navigate('/'); }}>Log out</button>;
}
