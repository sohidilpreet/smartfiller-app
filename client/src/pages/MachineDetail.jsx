import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import AssignUserForm from '../components/AssignUserForm';
import { getMe } from '../api/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function MachineDetail() {
  const { id } = useParams();
  const [machine, setMachine] = useState(null);
  const [user, setUser] = useState(null);
  const [runForm, setRunForm] = useState({ description: '', operatorName: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return navigate('/login');

    getMe(token)
      .then(res => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login');
      });

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
      .catch(() => setError('Machine not found or access denied.'));
  }, [id, navigate, token]);

  const logout = () => {
    localStorage.removeItem('token');
    navigate(0);
  };

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
    if (!window.confirm(`Delete file "${originalname}"?`)) return;

    try {
      await axios.delete(`http://localhost:5050/api/machines/${id}/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('File deleted');
      window.location.reload();
    } catch (err) {
      alert('Failed to delete file');
    }
  };
  
  const updateStatus = async (newStatus) => {
    try {
      await axios.put(`http://localhost:5050/api/machines/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.location.reload(); // Refresh without alert
    } catch (err) {
      console.error(err.response?.data || err.message);
      setError('Failed to update status');
    }
  };  

  if (error) {
    return <div className="container py-5 text-danger">{error}</div>;
  }

  if (!machine || !user) {
    return (
      <div className="min-h-screen d-flex align-items-center justify-content-center text-white">
        Loading Machine Details...
      </div>
    );
  }

  return (
    <div className="container py-4">
      <Header user={user} onLogout={logout} />

      <section className="card d-flex flex-row bg-white border-light rounded-4 shadow p-4 mb-4">
        <div className='col-lg-6'>
          <h2 className="h4 mb-3">{machine.name}</h2>
          <p className="text-muted mb-1">{machine.description}</p>
          <p><strong>📍 Location:</strong> {machine.location}</p>
          <p><strong>👤 Created By:</strong> {machine.created_by_name}</p>
          <p><strong>⚙️ Status:</strong> <span className="fw-bold text-success">{machine.status}</span></p>
        </div>
        <div className="col-lg-6 align-items-center d-flex gap-2 mt-3">
          <button onClick={() => updateStatus('Running')} className="btn btn-outline-success btn-sm" style={{height: 'fit-content'}}>▶️ Start Machine</button>
          <button onClick={() => updateStatus('Idle')} className="btn btn-outline-secondary btn-sm" style={{height: 'fit-content'}}>⏹️ Stop Machine</button>
          <button onClick={() => updateStatus('Error')} className="btn btn-outline-danger btn-sm" style={{height: 'fit-content'}}>⚠️ Report Error</button>
        </div>
      </section>

      <section className="card bg-white border-light rounded-4 shadow p-4 mb-4">
        <h4 className="mb-3">📈 Run Activity (Last 30 Days)</h4>
        {machine.stats?.history.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={machine.stats.history}>
                <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="total_runs" stroke="#7c3aed" />
              </LineChart>
            </ResponsiveContainer>

            <ul className="mt-3">
              <li><strong>Total Runs:</strong> {machine.stats.summary.total_runs}</li>
              <li><strong>Last Run:</strong> {new Date(machine.stats.summary.last_run).toLocaleString()}</li>
              <li><strong>Top Operator:</strong> {machine.stats.summary.top_operator || 'N/A'}</li>
            </ul>
          </>
        ) : <p className="text-muted">No activity in the last 30 days.</p>}
      </section>

      <section className="card bg-white border-light rounded-4 shadow p-4 mb-4">
        <h4 className="mb-3">📝 Log a Machine Run</h4>
        <form onSubmit={handleRunSubmit} className="d-flex flex-column gap-3">
          <input
            type="text"
            name="description"
            placeholder="What was done..."
            value={runForm.description}
            onChange={(e) => setRunForm(prev => ({ ...prev, description: e.target.value }))}
            className="form-control"
            required
          />
          <input
            type="text"
            name="operatorName"
            placeholder="Operator name (optional)"
            value={runForm.operatorName}
            onChange={(e) => setRunForm(prev => ({ ...prev, operatorName: e.target.value }))}
            className="form-control"
          />
          <button type="submit" className="btn btn-primary">Submit</button>
        </form>
      </section>

      <section className="card bg-white border-light rounded-4 shadow p-4 mb-4">
        <h4 className="mb-3">📂 Uploaded Files</h4>
        {machine.files?.length > 0 ? (
          <ul className="list-group">
            {machine.files.map(file => (
              <li key={file.id} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <a href={`http://localhost:5050/uploads/${file.filename}`} target="_blank" rel="noreferrer">
                    {file.originalname}
                  </a>{' '}
                  <small className="text-muted">by {file.uploaded_by_name} at {new Date(file.uploaded_at).toLocaleString()}</small>
                </div>
                {user.role === 'admin' && (
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteFile(file.id, file.originalname)}>
                    ❌
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : <p className="text-muted">No files uploaded.</p>}
      </section>

      {(user.role === 'admin' || user.role === 'controller') && (
        <section className="card bg-white border-light rounded-4 shadow p-4 mb-4">
          <h4 className="mb-3">📤 Upload File</h4>
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
                alert('File uploaded!');
                window.location.reload();
              } catch {
                alert('Upload failed');
              }
            }}
          >
            <input type="file" name="file" required className="form-control mb-2" />
            <button type="submit" className="btn btn-success">Upload</button>
          </form>
        </section>
      )}

      {user.role === 'admin' && (
        <section className="card bg-white border-light rounded-4 shadow p-4 mb-4">
          <h4 className="mb-3">👥 Assign Users to Machine</h4>
          <AssignUserForm machineId={id} />
        </section>
      )}

      <section className="card bg-white border-light rounded-4 shadow p-4 mb-4">
        <h4 className="mb-3">📜 Run History</h4>
        {machine.runs.length === 0 ? (
          <p className="text-muted">No runs logged yet.</p>
        ) : (
          <ul className="list-group">
            {machine.runs.map(run => (
              <li key={run.id} className="list-group-item">
                <strong>{new Date(run.run_time).toLocaleString()}</strong> – {run.description} by <strong>{run.user_name || run.operator_name}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default MachineDetail;
