import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateMachine from './pages/CreateMachine';
import CreateUser from './pages/CreateUser';
import MachineDetail from './pages/MachineDetail';

function App() {
  const token = localStorage.getItem('token');

  return (
    <Routes>
      <Route path="/" element={token ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={token ? <Navigate to="/" /> : <Register />} />
      <Route path="/machines/create" element={token ? <CreateMachine /> : <Navigate to="/login" />} />
      <Route path="/machines/:id" element={token ? <MachineDetail /> : <Navigate to="/login" />} />
      <Route path="/create-user" element={token ? <CreateUser /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
