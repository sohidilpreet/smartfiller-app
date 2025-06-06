import { useState } from 'react';
import axios from 'axios';

function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await axios.put('http://localhost:5050/api/users/change-password', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg(res.data.message);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to update password');
    }
  };

  return (
    <div>
      <h3>Change Password</h3>
      <form onSubmit={handleSubmit}>
        <input name="currentPassword" type="password" placeholder="Current Password" onChange={handleChange} required />
        <input name="newPassword" type="password" placeholder="New Password" onChange={handleChange} required />
        <button type="submit">Update Password</button>
      </form>
      <p>{msg}</p>
    </div>
  );
}

export default ChangePassword;
