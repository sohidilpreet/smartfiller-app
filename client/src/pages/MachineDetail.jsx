import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import AssignUserForm from '../components/AssignUserForm';
import { getMe } from '../api/auth'; // ✅ import

function MachineDetail() {
  const { id } = useParams();
  const [machine, setMachine] = useState(null);
  const [user, setUser] = useState(null); // ✅ state for logged-in user
  const [runForm, setRunForm] = useState({ description: '', operatorName: '' });
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    // Fetch user info first
    getMe(token)
      .then(res => setUser(res.data))
      .catch(err => {
        console.error('User fetch failed:', err.message);
        setError('Could not fetch user.');
      });

    // Then fetch machine
    axios.get(`http://localhost:5050/api/machines/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setMachine(res.data))
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

  if (error) return <p>{error}</p>;
  if (!machine) return <p>Loading...</p>;

  return (
    <div>
      <h2>{machine.name}</h2>
      <p>{machine.description}</p>
      <p><strong>Location:</strong> {machine.location}</p>
      <p><strong>Created By:</strong> {machine.created_by_name}</p>

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
            </li>
            ))}
        </ul>
        ) : (
        <p>No files uploaded.</p>
        )}
        <h3>Upload File</h3>
        <form
        onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append('file', e.target.file.files[0]);

            await axios.post(`http://localhost:5050/api/machines/${id}/upload`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
            });

            alert('Uploaded!');
            window.location.reload();
        }}
        >
        <input type="file" name="file" required />
        <button type="submit">Upload</button>
        </form>
        
      <hr />

      {/* ✅ Show assign form only for admins */}
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
