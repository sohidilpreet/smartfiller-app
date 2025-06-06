import { useEffect, useState } from 'react';
import axios from 'axios';

function MachineList() {
  const [machines, setMachines] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:5050/api/machines', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setMachines(res.data))
      .catch(err => setError(err.response?.data?.message || 'Error loading machines'));
  }, []);

  return (
    <div>
      <h2>Company Machines</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {machines.map(m => (
          <li key={m.id}>
            <strong>{m.name}</strong> – {m.description} ({m.location})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MachineList;
