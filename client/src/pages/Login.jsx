import { useState } from 'react';
import { login } from '../api/auth';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '', company_id: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await login(formData);
      localStorage.setItem('token', res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="py-5 min-h-screen d-flex align-items-center justify-content-center bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500">
      <div className="card shadow-lg p-5 rounded-4 bg-white" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 className="text-center mb-4">Login</h2>
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          <input className="form-control" name="company_id" placeholder="Company ID" onChange={handleChange} required />
          <input className="form-control" name="email" placeholder="Email" onChange={handleChange} required />
          <input className="form-control" name="password" type="password" placeholder="Password" onChange={handleChange} required />
          <button className="btn btn-primary mt-2" type="submit">Login</button>
          {error && <p className="text-danger mt-2">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default Login;
