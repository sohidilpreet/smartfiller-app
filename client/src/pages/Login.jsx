import { useState } from 'react';
import { login } from '../api/auth';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
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
      console.log('Login response:', res); // ✅ Add this
      localStorage.setItem('token', res.data.token);
      console.log('Navigating to /dashboard...');
      navigate(0);
    } catch (err) {
      console.error('Login error:', err); // ✅ Add this too
      setError(err.response?.data?.message || 'Login failed');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input name="email" placeholder="Email" onChange={handleChange} required />
      <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
      <button type="submit">Login</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}

export default Login;
