import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import AssignUserForm from '../components/AssignUserForm';
import { getMe } from '../api/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function MachineDetail() {
  const { id } = useParams();
  const [machine, setMachine] = useState(null);
  const [user, setUser] = useState(null);
  const [runForm, setRunForm] = useState({ description: '', operatorName: '' });
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    // Fetch logged-in user
    getMe(token)
      .then(res => setUser(res.data))
      .catch(err => {
        console.error('User fetch failed:', err.message);
        setError('Could not fetch user.');
      });

    // Fetch machine details
    Promise.all([
      axios.get(`http://localhost:5050/api/machines/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axios.get(`http://localhost:5050/api/machines/${id}/stats/runs`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ])
      .then(([machineRes, statsRes]) => {
        setMachine({ ...machineRes.data, stats: statsRes.data });
      })
      .catch(() => setError('Machine not found or access denied'));    
  }, [id]);

  const handleRunSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:5050/api/machines/${id}/run`, runForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.location.reload();
    } catch {
      setError('Failed to log machine run');
    }
  };

  const handleDeleteFile = async (fileId, originalname) => {
    const confirmed = window.confirm(`Delete file "${originalname}"?`);
    if (!confirmed) return;

    try {
      await axios.delete(`http://localhost:5050/api/machines/${id}/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('File deleted');
      window.location.reload();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete file');
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      await axios.put(`http://localhost:5050/api/machines/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Status updated to ${newStatus}`);
      window.location.reload();
    } catch (err) {
      console.error('Status update failed:', err);
      alert('Failed to update status');
    }
  };

  if (error) return <p>{error}</p>;
  if (!machine || !user) return <p>Loading...</p>;

  return (
    <div>
      <h2>{machine.name}</h2>
      <p>{machine.description}</p>
      <p><strong>Location:</strong> {machine.location}</p>
      <p><strong>Created By:</strong> {machine.created_by_name}</p>
      <p><strong>Status:</strong> <span style={{ fontWeight: 'bold', color: 'darkgreen' }}>{machine.status}</span></p>
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => updateStatus('Running')}>Simulate Running</button>{' '}
        <button onClick={() => updateStatus('Idle')}>Simulate Idle</button>{' '}
        <button onClick={() => updateStatus('Error')}>Simulate Error</button>
      </div>

      <hr />
      <h3>📈 Run Activity (Last 30 Days)</h3>
      {machine.stats && machine.stats.history.length > 0 ? (
        <>
          <ResponsiveContainer width="40%" height={300}>
            <LineChart data={machine.stats.history}>
              <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="total_runs" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>

          <p><strong>Total Runs:</strong> {machine.stats.summary.total_runs}</p>
          <p><strong>Last Run:</strong> {new Date(machine.stats.summary.last_run).toLocaleString()}</p>
          <p><strong>Top Operator:</strong> {machine.stats.summary.top_operator || 'N/A'}</p>
        </>
      ) : (
        <p>No activity in the last 30 days.</p>
      )}

      <hr />
      <h3>Log a Machine Run</h3>
      <form onSubmit={handleRunSubmit}>
        <input
          type="text"
          name="description"
          placeholder="What was done..."
          onChange={(e) => setRunForm(prev => ({ ...prev, description: e.target.value }))}
          required
        />
        <input
          type="text"
          name="operatorName"
          placeholder="Operator name (optional)"
          onChange={(e) => setRunForm(prev => ({ ...prev, operatorName: e.target.value }))}
        />
        <button type="submit">Log Run</button>
      </form>

      <hr />
      <h3>Uploaded Files</h3>
      {machine.files && machine.files.length > 0 ? (
        <ul>
          {machine.files.map(file => (
            <li key={file.id}>
              <a href={`http://localhost:5050/uploads/${file.filename}`} target="_blank" rel="noreferrer">
                {file.originalname}
              </a>{' '}
              — uploaded by <strong>{file.uploaded_by_name}</strong> at {new Date(file.uploaded_at).toLocaleString()}
              {user.role === 'admin' && (
                <button
                  onClick={() => handleDeleteFile(file.id, file.originalname)}
                  style={{ marginLeft: '10px', color: 'red' }}
                >
                  ❌ Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No files uploaded.</p>
      )}

      {(user.role === 'admin' || user.role === 'controller') && (
        <>
          <h3>Upload File</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData();
              formData.append('file', e.target.file.files[0]);

              try {
                await axios.post(`http://localhost:5050/api/machines/${id}/upload`, formData, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                  }
                });
                alert('Uploaded!');
                window.location.reload();
              } catch (err) {
                console.error('Upload failed:', err);
                alert('Upload failed');
              }
            }}
          >
            <input type="file" name="file" required />
            <button type="submit">Upload</button>
          </form>
        </>
      )}

      <hr />
      {user && user.role === 'admin' && (
        <AssignUserForm machineId={id} />
      )}

      <hr />
      <h3>Run History</h3>
      {machine.runs.length === 0 ? (
        <p>No runs logged yet.</p>
      ) : (
        <ul>
          {machine.runs.map(run => (
            <li key={run.id}>
              {new Date(run.run_time).toLocaleString()} – {run.description} by <strong>{run.user_name || run.operator_name}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MachineDetail;
