import { useState } from 'react';
import { register } from '../api/auth';
import { useNavigate } from 'react-router-dom';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      await register(formData);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="py-5 min-h-screen d-flex align-items-center justify-content-center bg-gradient-to-br from-green-500 via-teal-600 to-blue-500">
      <div className="card shadow-lg p-5 rounded-4 bg-white" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 className="text-center mb-4">Register</h2>
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          <input className="form-control" type="text" name="name" placeholder="Name" onChange={handleChange} required />
          <input className="form-control" type="email" name="email" placeholder="Email" onChange={handleChange} required />
          <input className="form-control" type="password" name="password" placeholder="Password" onChange={handleChange} required />
          <button className="btn btn-success mt-2" type="submit">Register</button>
          {error && <p className="text-danger mt-2">{error}</p>}
          {success && <p className="text-success mt-2">Registered successfully! Redirecting...</p>}
        </form>
      </div>
    </div>
  );
}

export default Register;
