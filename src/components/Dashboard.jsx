import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { COURSES, displayDate, shortCourse } from '../data.js';

export default function Dashboard({ user, sessions, myCourses, onJoin, onAddCourse, onRemoveCourse }) {
  const [filter, setFilter] = useState('all');
  const [newCourse, setNewCourse] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [quoteRequest, setQuoteRequest] = useState(0);

  // Genuine third-party HTTP request made directly from the browser.
  useEffect(() => {
    const controller = new AbortController();
    setQuoteError('');
    fetch('https://dummyjson.com/quotes/random', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!data.quote || !data.author) throw new Error('Unexpected response');
        setQuote({ text: data.quote, author: data.author });
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setQuoteError('Quote service unavailable. Try again later.');
      });
    return () => controller.abort();
  }, [quoteRequest]);

  const availableCourses = [...new Set([...COURSES, ...sessions.map((session) => session.course)])];
  const filtered = sessions.filter((session) => filter === 'all' || session.course === filter);

  async function submitCourse(event) {
    event.preventDefault();
    if (!newCourse.trim()) return;
    await onAddCourse(newCourse);
    setNewCourse('');
  }

  return (
    <main>
      <h2>Welcome, {user?.name || 'Guest'}!</h2>
      <h3>Available Study Sessions</h3>
      <label htmlFor="course-filter">Filter by course: </label>{' '}
      <select id="course-filter" value={filter} onChange={(event) => setFilter(event.target.value)}>
        <option value="all">All courses</option>
        {availableCourses.map((course) => <option key={course} value={course}>{course}</option>)}
      </select>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Course</th><th>Location</th><th>Date</th><th>Time</th><th>Students</th><th>Action</th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6}>No sessions for this course yet.</td></tr>}
            {filtered.map((session) => {
              const joined = user && session.members.includes(user.email);
              const full = session.members.length >= session.maxStudents;
              return (
                <tr key={session.id}>
                  <td>{shortCourse(session.course)}</td>
                  <td>{session.location}</td>
                  <td>{displayDate(session.date)}</td>
                  <td>{session.time}</td>
                  <td>{session.members.length}/{session.maxStudents}</td>
                  <td>
                    {joined ? <Link className="btn btn-success btn-sm" to={`/chat?session=${session.id}`}>Chat</Link>
                      : <button type="button" className="btn btn-primary btn-sm" disabled={full} onClick={() => onJoin(session.id)}>
                        {full ? 'Full' : 'Join'}
                      </button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {user ? (
        <section>
          <h3>My Courses</h3>
          <div className="course-tags">
            {myCourses.length === 0 && <p>Add a course you are taking.</p>}
            {myCourses.map((course) => (
              <span className="course-tag" key={course}>{course}{' '}
                <button type="button" aria-label={`Remove ${course}`} onClick={() => onRemoveCourse(course)}>×</button>
              </span>
            ))}
          </div>
          <form className="add-course-form" onSubmit={submitCourse}>
            <label htmlFor="new-course">Add course:</label>{' '}
            <input id="new-course" placeholder="e.g. CS 224" value={newCourse} onChange={(event) => setNewCourse(event.target.value)} maxLength={80} required />{' '}
            <button className="btn btn-primary" type="submit">Add</button>
          </form>
        </section>
      ) : <p><Link to="/">Log in</Link> to join sessions and save your courses.</p>}
      <section>
        <h3>Study Motivation</h3>
        {quote && <><p>“{quote.text}”</p><p>— {quote.author}</p></>}
        {!quote && !quoteError && <p>Loading a quote…</p>}
        {quoteError && <p role="status">{quoteError}</p>}
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setQuoteRequest((number) => number + 1)}>New quote</button>{' '}
        <small className="text-muted">Live quote from <a href="https://dummyjson.com/docs/quotes" target="_blank" rel="noreferrer">DummyJSON API</a></small>
      </section>
    </main>
  );
}
