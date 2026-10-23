import { useState } from 'react';
import { Link } from 'react-router-dom';
import { COURSES, dateAfter, displayDate, shortCourse } from '../data.js';

export default function Sessions({ user, sessions, onCreate, onLeave }) {
  const [course, setCourse] = useState(COURSES[0]);
  const [date, setDate] = useState(dateAfter(1));
  const [time, setTime] = useState('18:00');
  const [location, setLocation] = useState('');
  const [maxStudents, setMaxStudents] = useState(5);
  const [otherCourse, setOtherCourse] = useState('');
  const mine = user ? sessions.filter((session) => session.members.includes(user.email)) : [];

  function submit(event) {
    event.preventDefault();
    const selectedCourse = course === 'other' ? otherCourse.trim() : course;
    if (!selectedCourse || !date || !time || !location.trim()) return;
    if (date < dateAfter(0)) return;
    onCreate({ course: selectedCourse, date, time, location, maxStudents });
    setLocation('');
  }

  return (
    <main>
      <section>
        <h3>Create a Study Session</h3>
        {user ? (
          <form className="session-form" onSubmit={submit}>
            <div><label htmlFor="course">Course:</label>
              <select id="course" value={course} onChange={(event) => setCourse(event.target.value)}>
                {COURSES.map((item) => <option value={item} key={item}>{item}</option>)}
                <option value="other">Other course…</option>
              </select>
            </div>
            {course === 'other' && (
              <div><label htmlFor="other-course">Course name:</label>
                <input id="other-course" value={otherCourse} onChange={(event) => setOtherCourse(event.target.value)} required maxLength={80} placeholder="e.g. CS 224" />
              </div>
            )}
            <div><label htmlFor="date">Date:</label><input type="date" id="date" value={date} min={dateAfter(0)} onChange={(event) => setDate(event.target.value)} required /></div>
            <div><label htmlFor="time">Time:</label><input type="time" id="time" value={time} onChange={(event) => setTime(event.target.value)} required /></div>
            <div><label htmlFor="location">Location:</label><input type="text" id="location" placeholder="e.g. Library, Talmage Building" value={location} onChange={(event) => setLocation(event.target.value)} maxLength={100} required /></div>
            <div><label htmlFor="max-students">Max Students:</label>
              <select id="max-students" value={maxStudents} onChange={(event) => setMaxStudents(Number(event.target.value))}>
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => <option key={count} value={count}>{count}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Create Session</button>
          </form>
        ) : <p><Link to="/">Log in</Link> to create a study session.</p>}
      </section>
      <section>
        <h3>My Study Sessions</h3>
        {mine.length === 0 ? <p>You haven't joined any sessions yet. <Link to="/dashboard">Browse available sessions</Link>.</p> : (
          <div className="table-scroll">
            <table>
              <thead><tr><th>Course</th><th>Date</th><th>Time</th><th>Location</th><th>Students</th><th>Action</th></tr></thead>
              <tbody>
                {mine.map((session) => (
                  <tr key={session.id}>
                    <td>{shortCourse(session.course)}</td><td>{displayDate(session.date)}</td>
                    <td>{session.time}</td><td>{session.location}</td>
                    <td>{session.members.length}/{session.maxStudents}</td>
                    <td className="actions-cell">
                      <Link className="btn btn-primary btn-sm" to={`/chat?session=${session.id}`}>Chat</Link>{' '}
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => onLeave(session.id)}>
                        {session.createdBy === user.email ? 'Delete' : 'Leave'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
