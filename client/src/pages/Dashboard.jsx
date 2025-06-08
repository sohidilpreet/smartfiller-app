import { useEffect, useState } from 'react';
import { getMe } from '../api/auth';
import { getMyMachines } from '../api/machines';
import { useNavigate, Link } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return setLoading(false);
    getMe(token)
      .then(res => {
        setUser(res.data);
        return getMyMachines(token);
      })
      .then(res => {
        setMachines(res.data.machines || []);
      })
      .catch(err => {
        console.error(err);
        localStorage.removeItem('token');
        navigate('/login');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('token');
    navigate(0);
  };

  if (loading) return <p className="loading">Loading...</p>;
  if (!user) return <p className="not-logged-in">You are not logged in.</p>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Hi, {user.name}</h1>
          <p className="company">Company: {user.company_name}</p>
        </div>
        <div className="header-actions">
          <button onClick={logout} className="btn-secondary">Logout</button>
          {user.role === 'admin' && (
            <Link to="/create-user" className="btn-primary">➕ Add User</Link>
          )}
          <Link to="/create-machine" className="btn-primary">➕ Add Machine</Link>
        </div>
      </header>

      <section className="machine-list-section">
        <h2>Your Machines</h2>
        {machines.length === 0 ? (
          <p className="no-machines">No machines yet.</p>
        ) : (
          <div className="machine-grid">
            {machines.map(m => (
              <Link to={`/machines/${m.id}`} key={m.id} className="machine-card">
                <h3>{m.name}</h3>
                <p>{m.description}</p>
                <span className="location">{m.location}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
