import { useState } from 'react';
import axios from 'axios';

function CreateUser() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer' });
  const [message, setMessage] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
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

  return (
    <div>
      <h3>Create New Company User</h3>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" onChange={handleChange} required /><br />
        <input name="email" placeholder="Email" onChange={handleChange} required type="email" /><br />
        <input name="password" placeholder="Password" onChange={handleChange} required type="password" /><br />
        <select name="role" onChange={handleChange}>
          <option value="viewer">Viewer</option>
          <option value="controller">Controller</option>
        </select><br />
        <button type="submit">Create User</button>
      </form>
      <p>{message}</p>
    </div>
  );
}

export default CreateUser;
