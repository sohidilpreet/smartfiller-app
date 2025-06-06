import { useState } from 'react';
import axios from 'axios';

function FileUpload({ machineId }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setMessage('No file selected');

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`http://localhost:5050/api/upload/${machineId}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('✅ File uploaded successfully');
    } catch (err) {
      setMessage(err.response?.data?.message || '❌ Upload failed');
    }
  };

  return (
    <form onSubmit={handleUpload}>
      <h3>Upload File to Machine</h3>
      <input type="file" onChange={handleFileChange} />
      <button type="submit">Upload</button>
      {message && <p>{message}</p>}
    </form>
  );
}

export default FileUpload;
