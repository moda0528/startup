import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login({ user, onLogin }) {
  const navigate = useNavigate();
  const [create, setCreate] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function submit(event) {
    event.preventDefault();
    onLogin({ name, email, create });
    setPassword('');
    navigate('/dashboard');
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
          <h3>{create ? 'Create a demo account' : 'Demo login'}</h3>
          {create && (
            <div>
              <label htmlFor="name">Your name:</label>
              <input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" required maxLength={60} />
            </div>
          )}
          <div>
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="your@email.com" required />
          </div>
          <div>
            <label htmlFor="password">Demo password:</label>
            <input type="password" id="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Any password (not saved)" required minLength={4} />
          </div>
          <button type="submit" className="btn btn-primary me-2">{create ? 'Create Account' : 'Login'}</button>
          <button type="button" className="btn btn-secondary" onClick={() => setCreate((previous) => !previous)}>
            {create ? 'Back to Login' : 'Create Account'}
          </button>
          <p className="demo-note">Demo only: any email and password (4+ characters) work. Passwords are not stored or checked.</p>
        </form>
      )}
    </main>
  );
}
