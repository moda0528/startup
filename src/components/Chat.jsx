export default function Chat() {
  return (
    <main>
      <section>
        <h2>Study Group Chat</h2>
        <h3>CS 235 - Data Structures</h3>
        <p>Library Study Group</p>
      </section>

      <section>
        <h3>Messages</h3>

        <div className="messages">
          <p>
            <strong>Alex:</strong> Are we studying chapter 5?
          </p>

          <p className="my-message">
            <strong>Me:</strong> Yeah, sounds good!
          </p>

          <p>
            <strong>Sam:</strong> I'll be there!
          </p>
        </div>

        <form
          className="chat-form"
          onSubmit={(e) => e.preventDefault()}
        >
          <label htmlFor="message">Message:</label>

          <input
            type="text"
            id="message"
            placeholder="Type a message..."
          />

          <button type="submit" className="btn btn-primary">
            Send
          </button>
        </form>
      </section>

      <section>
        <h3>Online Users</h3>
        <ul>
          <li>Alex</li>
          <li>Sam</li>
          <li>User</li>
        </ul>
      </section>
    </main>
  );
}