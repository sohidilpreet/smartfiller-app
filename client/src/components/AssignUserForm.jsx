import { useState, useEffect } from 'react';
import axios from 'axios';

function AssignUserForm({ machineId }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [role, setRole] = useState('viewer');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      console.warn("No token found");
      return;
    }

    axios.get('http://localhost:5050/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      console.log("Fetched users:", res.data.users);
      setUsers(res.data.users || []);
    })
    .catch(err => {
      console.error("Failed to fetch users:", err);
    });
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:5050/api/machines/${machineId}/assign-user`, {
        userId: selectedUser,
        role
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('User assigned!');
    } catch (err) {
      console.error('Assignment failed:', err.message);
      alert('Error assigning user');
    }
  };

  return (
    <form onSubmit={handleAssign}>
      <label>
        User:
        <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} required>
          <option value="">Select User</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </label>

      <label>
        Role:
        <select value={role} onChange={e => setRole(e.target.value)} required>
          <option value="viewer">Viewer</option>
          <option value="controller">Controller</option>
        </select>
      </label>

      <button type="submit">Assign</button>
    </form>
  );
}

export default AssignUserForm;
