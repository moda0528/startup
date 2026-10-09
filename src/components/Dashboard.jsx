export default function Dashboard() {
  return (
    <main>
      <h2>Welcome, User!</h2>
      <h3>Available Study Sessions</h3>

      <select defaultValue="CS 235 - Data Structures">
        <option>CS 235 - Data Structures</option>
        <option>CS 260 - Web Programming</option>
        <option>MATH 112 - Calculus</option>
      </select>

      <table>
        <tbody>
          <tr>
            <th>Course</th>
            <th>Location</th>
            <th>Time</th>
            <th>Students</th>
            <th>Action</th>
          </tr>
          <tr>
            <td>CS 235</td>
            <td>Library</td>
            <td>18:00</td>
            <td>3</td>
            <td><button className="btn btn-primary">Join</button></td>
          </tr>
          <tr>
            <td>CS 260</td>
            <td>Talmage</td>
            <td>15:00</td>
            <td>4</td>
            <td><button className="btn btn-primary">Join</button></td>
          </tr>
          <tr>
            <td>MATH 112</td>
            <td>Library</td>
            <td>17:00</td>
            <td>2</td>
            <td><button className="btn btn-primary">Join</button></td>
          </tr>
        </tbody>
      </table>

      <section>
        <h3>Study Motivation</h3>
        <p>"Inspirational quote will appear here."</p>
        <p>- Quote Author</p>
      </section>
    </main>
  );
}