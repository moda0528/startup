export default function Sessions() {
  return (
    <main>
      <section>
        <h3>Create a Study Session</h3>

        <form className="session-form" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="course">Course:</label>
            <select id="course">
              <option>CS 235 - Data Structures</option>
              <option>CS 260 - Web Programming</option>
              <option>MATH 112 - Calculus</option>
            </select>
          </div>

          <div>
            <label htmlFor="date">Date:</label>
            <input type="date" id="date" />
          </div>

          <div>
            <label htmlFor="time">Time:</label>
            <input type="time" id="time" />
          </div>

          <div>
            <label htmlFor="location">Location:</label>
            <input
              type="text"
              id="location"
              placeholder="Ex) Library, Talmage Building, etc."
            />
          </div>

          <div>
            <label htmlFor="max-students">Max Students:</label>
            <select id="max-students">
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((number) => (
                <option key={number}>{number}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary">
            Create Session
          </button>
        </form>
      </section>

      <section>
        <h3>My Study Sessions</h3>

        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Date</th>
              <th>Time</th>
              <th>Location</th>
              <th>Students</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>CS 235</td>
              <td>September 25</td>
              <td>18:00</td>
              <td>Library</td>
              <td>3/5</td>
              <td>
                <button className="btn btn-danger">Leave</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}