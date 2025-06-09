import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { getMe } from '../api/auth';

function CreateUser() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer' });
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    getMe(token)
      .then(res => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login');
      });
  }, [navigate]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post('http://localhost:5050/api/users', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`✅ ${res.data.message}`);
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.message || 'Error creating user'}`);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate(0);
  };

  if (!user) {
    return <div className="text-center mt-5 text-muted">Loading user...</div>;
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-light d-flex flex-column align-items-center justify-content-center">
        <Header user={user} onLogout={logout} />
        <div className="card bg-white border-0 shadow rounded-4 p-5 text-center" style={{ maxWidth: '500px' }}>
          <h2>🚫 Access Denied</h2>
          <p className="text-muted">You do not have permission to create new users.</p>
          <button className="btn btn-secondary mt-3" onClick={() => navigate('/')}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <Header user={user} onLogout={logout} />
      <section className="card bg-white text-dark border-light rounded-4 shadow p-5 mx-auto" style={{ maxWidth: '600px' }}>
        <h2 className="h4 mb-4 d-flex align-items-center gap-2">
          <span>👤</span>
          <span>Create New User</span>
        </h2>

        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          <input name="name" className="form-control" placeholder="Name" value={form.name} onChange={handleChange} required />
          <input name="email" type="email" className="form-control" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input name="password" type="password" className="form-control" placeholder="Password" value={form.password} onChange={handleChange} required />
          <select name="role" className="form-select" value={form.role} onChange={handleChange}>
            <option value="viewer">Viewer</option>
            <option value="controller">Controller</option>
          </select>
          <button type="submit" className="btn btn-primary mt-2">Create User</button>
          {message && <div className={`mt-2 ${message.startsWith('✅') ? 'text-success' : 'text-danger'}`}>{message}</div>}
        </form>
      </section>
    </div>
  );
}

export default CreateUser;
