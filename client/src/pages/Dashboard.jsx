import { useEffect, useState } from 'react';
import { getMe } from '../api/auth';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ Add this
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
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setLoading(false);
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
        <p>Loading...</p> // ✅ show loading until user is resolved
      ) : user ? (
        <>
          <p>Welcome, {user.name} ({user.email})</p>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <p>You are not logged in.</p>
      )}
    </div>
  );
}

export default Dashboard;
