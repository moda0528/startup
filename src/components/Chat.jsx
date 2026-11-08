import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { shortCourse } from '../data.js';

export default function Chat({ user, sessions, messages, onSend, onLoadMessages }) {
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  const mine = user ? sessions.filter((session) => session.members.includes(user.email)) : [];
  const selectedId = params.get('session');
  const active = mine.find((session) => session.id === selectedId) || mine[0];
  const conversation = active ? messages[active.id] || [] : [];

  // Poll the Express API to see messages from other browser sessions.
  // A later deliverable will replace polling with real WebSockets.
  useEffect(() => {
    if (!active || !user) return undefined;
    let current = true;
    const refresh = () => onLoadMessages(active.id)
      .then(() => { if (current) setLoadError(''); })
      .catch((error) => { if (current) setLoadError(error.message); });
    refresh();
    const timer = setInterval(refresh, 10000);
    return () => { current = false; clearInterval(timer); };
  }, [active?.id, user?.email, onLoadMessages]);

  async function send(event) {
    event.preventDefault();
    if (!active || !draft.trim() || busy) return;
    setBusy(true);
    try {
      const success = await onSend(active.id, draft);
      if (success) setDraft('');
    } finally { setBusy(false); }
  }

  if (!user) return <main><h2>Study Group Chat</h2><p><Link to="/">Log in</Link> to chat with your study groups.</p></main>;
  if (!active) return <main><h2>Study Group Chat</h2><p>Join a session from the <Link to="/dashboard">Dashboard</Link> to start chatting.</p></main>;

  return (
    <main>
      <section>
        <h2>Study Group Chat</h2>
        <label htmlFor="group-select">Your study group: </label>{' '}
        <select id="group-select" value={active.id} onChange={(event) => { setParams({ session: event.target.value }); setDraft(''); }}>
          {mine.map((session) => <option value={session.id} key={session.id}>{shortCourse(session.course)} — {session.location}</option>)}
        </select>
        <h3>{active.course}</h3>
        <p>{active.location} Study Group</p>
      </section>
      <section>
        <h3>Messages</h3>
        {loadError && <p role="alert" className="text-danger">{loadError}</p>}
        <div className="messages" role="log" aria-label="Chat messages" aria-live="polite">
          {conversation.length === 0 && <p>No messages yet. Say hello!</p>}
          {conversation.map((message) => (
            <p key={message.id} className={message.from === user.email ? 'my-message' : ''}>
              <strong>{message.from === user.email ? 'Me' : message.from}:</strong> {message.text}
            </p>
          ))}
        </div>
        <form className="chat-form" onSubmit={send}>
          <label htmlFor="message">Message:</label>
          <input id="message" type="text" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Type a message..." maxLength={500} required />
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Send'}</button>
        </form>
        <small className="text-muted">Messages use the Express backend. New messages are checked every 10 seconds until real WebSockets are added.</small>
      </section>
      <section>
        <h3>Group Members ({active.members.length})</h3>
        <ul className="member-list">
          {active.members.map((member) => (
            <li key={member}>{member === user.email ? `${user.name} (you)` : member.split('@')[0]}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
