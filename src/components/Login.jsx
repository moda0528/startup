import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login({ user, onLogin }) {
  const navigate = useNavigate();
  const [create, setCreate] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onLogin({ name, email, password, create });
      setPassword('');
      navigate('/dashboard');
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <h2 id="tagline">Connect with classmates, find study partners, and join study sessions.</h2>
      <p className="home-source"><a href="https://github.com/moda0528/startup" target="_blank" rel="noreferrer">View StudyMatch on GitHub</a></p>
      {user ? (
        <section className="welcome-section">
          <h3>Welcome, {user.name}!</h3>
          <p>Find a study group or create your own session.</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Browse study sessions</button>
        </section>
      ) : (
        <form className="login-form" onSubmit={submit}>
          <img className="login-logo" src="/StudyMatch(1).png" alt="StudyMatch" />
          <h3>{create ? 'Create an account' : 'Log in'}</h3>
          {create && (
            <div>
              <label htmlFor="name">Your name:</label>
              <input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" required maxLength={60} />
            </div>
          )}
          <div>
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="your@email.com" required maxLength={254} />
          </div>
          <div>
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" value={password} onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters" required minLength={create ? 8 : 1} maxLength={128} autoComplete={create ? 'new-password' : 'current-password'} />
          </div>
          {error && <p role="alert" className="text-danger">{error}</p>}
          <button type="submit" className="btn btn-primary me-2" disabled={busy}>{busy ? 'Please wait…' : create ? 'Create Account' : 'Login'}</button>
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => { setCreate((previous) => !previous); setError(''); }}>
            {create ? 'Back to Login' : 'Create Account'}
          </button>
          <p className="demo-note">Passwords are verified by the server using BCrypt. For this class deliverable, accounts are temporary and reset when the backend restarts; use a test password.</p>
        </form>
      )}
    </main>
  );
}
