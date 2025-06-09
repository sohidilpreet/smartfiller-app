import { useState, useEffect } from 'react';
import { createMachine } from '../api/machines';
import { getMe } from '../api/auth';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';

function CreateMachine() {
  const [formData, setFormData] = useState({ name: '', description: '', location: '' });
  const [error, setError] = useState('');
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

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('token');
      await createMachine(formData, token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Machine creation failed');
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
          <p className="text-muted">Only admins can create new machines.</p>
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
          <span>➕</span>
          <span>Create New Machine</span>
        </h2>

        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          <input
            name="name"
            placeholder="Machine Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="form-control"
          />
          <input
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            required
            className="form-control"
          />
          <input
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
            required
            className="form-control"
          />
          <button type="submit" className="btn btn-primary mt-2">
            Create Machine
          </button>
          {error && <p className="text-danger mt-2">{error}</p>}
        </form>
      </section>
    </div>
  );
}

export default CreateMachine;
