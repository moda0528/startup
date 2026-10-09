export default function Login() {
  return (
    <main>
      <h2 id="tagline">
        Connect with classmates, find study partners, and join study sessions.
      </h2>

      <form className="login-form" onSubmit={(e) => e.preventDefault()}>
        <img
          className="login-logo"
          src="/StudyMatch(1).png"
          alt="StudyMatch"
        />

        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            placeholder="password"
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Login
        </button>

        <button type="button" className="btn btn-secondary">
          Create Account
        </button>
      </form>

      <p>Welcome, User!</p>
    </main>
  );
}