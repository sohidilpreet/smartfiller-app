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
      <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
      <Route path="/register" element={token ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/machines/create" element={<CreateMachine />} />
      <Route path="/machines/:id" element={<MachineDetail />} />
      <Route path="/create-user" element={<CreateUser />} />
    </Routes>
  );
}

export default App;
