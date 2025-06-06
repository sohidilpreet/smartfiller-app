import { useEffect, useState } from 'react';
import { getMe } from '../api/auth';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { getMyMachines } from '../api/machines';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    getMe(token)
      .then(res => {
        setUser(res.data);
        return axios.get('http://localhost:5050/api/machines', {
          headers: { Authorization: `Bearer ${token}` }
        });
      })
      .then(res => {
        setMachines(res.data.machines || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        localStorage.removeItem('token');
        navigate('/login');
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate(0);
  };

  return (
    <div>
      <h2>Dashboard</h2>
      {loading ? (
        <p>Loading...</p>
      ) : user ? (
        <>
          <p>Welcome, {user.name} ({user.email})</p>
          <p>Company: <strong>{user.company_name}</strong></p>
          <button onClick={handleLogout}>Logout</button>

          <hr />
          <Link to="/create-user">➕ Add New User</Link>
          <hr />
          <h3>Your Machines</h3>
          {machines.length === 0 ? (
            <p>No machines yet.</p>
          ) : (
            <ul>
              {machines.map(m => (
                <li key={m.id}>
                  <Link to={`/machines/${m.id}`}><strong>{m.name}</strong></Link> – {m.description} ({m.location})
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p>You are not logged in.</p>
      )}
    </div>
  );
}

export default Dashboard;
