import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { shortCourse } from '../data.js';

const REPLIES = [
  'Does anyone want to review the practice problems?',
  'I can bring my notes to the study session.',
  'Thanks! Looking forward to studying together.',
  'Let’s compare answers when we meet.',
];

export default function Chat({ user, sessions, messages, onSend, onSimulatedMessage }) {
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState('');
  const replyIndex = useRef(0);
  const mine = user ? sessions.filter((session) => session.members.includes(user.email)) : [];
  const selectedId = params.get('session');
  const active = mine.find((session) => session.id === selectedId) || mine[0];
  const conversation = active ? (messages[active.id] || []) : [];

  // Mock an occasional incoming WebSocket message while the chat page is open.
  useEffect(() => {
    if (!active || !user) return undefined;
    const interval = setInterval(() => {
      const from = replyIndex.current % 2 === 0 ? 'Alex' : 'Sam';
      onSimulatedMessage(active.id, from, REPLIES[replyIndex.current % REPLIES.length]);
      replyIndex.current += 1;
    }, 25000);
    return () => clearInterval(interval);
  }, [active?.id, user?.email, onSimulatedMessage]);

  function send(event) {
    event.preventDefault();
    if (!active || !draft.trim()) return;
    onSend(active.id, draft);
    setDraft('');
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
          <button type="submit" className="btn btn-primary">Send</button>
        </form>
        <small className="text-muted">Demo chat: messages are stored locally. Incoming replies are simulated about every 25 seconds.</small>
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
