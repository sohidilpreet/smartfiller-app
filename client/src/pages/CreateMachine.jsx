import { useState } from 'react';
import { createMachine } from '../api/machines';
import { useNavigate } from 'react-router-dom';

function CreateMachine() {
  const [formData, setFormData] = useState({ name: '', description: '', location: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('token');
      await createMachine(formData, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Machine creation failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Machine</h2>
      <input name="name" placeholder="Machine Name" onChange={handleChange} required />
      <input name="description" placeholder="Description" onChange={handleChange} required />
      <input name="location" placeholder="Location" onChange={handleChange} required />
      <button type="submit">Create</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}

export default CreateMachine;
