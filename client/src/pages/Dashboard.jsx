import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { getMe } from '../api/auth';
import { getMyMachines } from '../api/machines';
import { useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [machines, setMachines] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return setLoading(false);

    getMe(token)
      .then(res => {
        setUser(res.data);
        return getMyMachines(token);
      })
      .then(res => {
        setMachines(res.data.machines || []);
      })
      .catch(err => {
        console.error(err);
        localStorage.removeItem('token');
        navigate('/login');
      })
      .finally(() => setLoading(false));
  }, [navigate]);


  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (user && token) {
      axios.get('http://localhost:5050/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setUsers(res.data.users || []);
      })
      .catch(err => {
        console.error("Failed to fetch users:", err);
      });
    }
  }, [user]);  
  

  const logout = () => {
    localStorage.removeItem('token');
    navigate(0);
  };

  const activeMachines = machines.filter(machine => machine.status === 'Running').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center">
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="text-white text-xl font-semibold">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 via-pink-600 to-purple-600 flex items-center justify-center">
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 shadow-2xl text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-white text-xl font-semibold">You are not logged in.</p>
          <Link 
            to="/login" 
            className="inline-block mt-4 bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-3">
      <Header user={user} onLogout={logout} />

      {/* Navigation Tabs */}
      <div className="container pt-3 pb-5">
        <div className="d-flex gap-2 flex-wrap">
          {['dashboard', 'machines', 'users'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="main">
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Section */}
            <div className="row g-4 mb-5">
              <div className="col-md-4">
                <div className="card bg-white border-light rounded-4 shadow">
                  <div className="card-body d-flex align-items-center gap-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center bg-primary bg-opacity-25" style={{ width: '48px', height: '48px' }}>
                      <span className="fs-4">🏭</span>
                    </div>
                    <div>
                      <p className="mb-1">Total Machines</p>
                      <h3 className="stat-number fw-bold mb-0">{machines.length}</h3>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card bg-white border-light rounded-4 shadow">
                  <div className="card-body d-flex align-items-center gap-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center bg-success bg-opacity-25" style={{ width: '48px', height: '48px' }}>
                      <span className="fs-4">✅</span>
                    </div>
                    <div>
                      <p className="mb-1">Active Now</p>
                      <h3 className="stat-number fw-bold mb-0">{activeMachines}</h3>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card bg-white border-light rounded-4 shadow">
                  <div className="card-body d-flex align-items-center gap-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center bg-purple bg-opacity-25" style={{ width: '48px', height: '48px' }}>
                      <span className="fs-4">👥</span>
                    </div>
                    <div>
                      <p className="mb-1">Users</p>
                      <h3 className="stat-number fw-bold mb-0">{users.length}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Machines */}
            <section className="card bg-white text-dark border-light rounded-4 shadow p-4">
              <h2 className="h5 mb-4 d-flex align-items-center gap-2">
                <span>🏭</span>
                <span>Your Top Machines</span>
              </h2>
              <div className="row g-4">
                {machines.slice(0, 3).map(machine => (
                  <div className="col-md-4" key={machine.id}>
                    <Link to={`/machines/${machine.id}`} className="card border-0 px-2">
                      <div className="card-body bg-dark bg-opacity-50 border-light rounded-4 shadow text-white text-decoration-none h-100 px-4">
                        <div className="d-flex justify-content-between mb-3">
                          <div className="rounded bg-gradient d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(to top right, #60a5fa, #a78bfa)', width: '40px', height: '40px' }}>
                            <span className="fw-bold text-white">{machine.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className={`rounded-circle ${machine.status === 'Running' ? 'bg-success' : 'bg-danger'}`} style={{ width: '10px', height: '10px' }}></div>
                        </div>
                        <h5 className="fw-bold mb-2">{machine.name}</h5>
                        <p className="text-white-50 small mb-3">{machine.description}</p>
                        <div className="d-flex justify-content-between">
                          <small className="text-white-50">
                            📍 {machine.location}
                          </small>
                          <span className="text-white-50">➔</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === 'machines' && (
          <section className="card bg-white text-dark border-light rounded-4 shadow p-4">
            <h2 className="h5 mb-4 d-flex align-items-center gap-2">
              <span>🏭</span>
              <span>All Machines</span>
            </h2>
            <div className="row g-4">
              {machines.map(machine => (
                <div className="col-md-4" key={machine.id}>
                <Link to={`/machines/${machine.id}`} className="card border-0 px-2">
                  <div className="card-body bg-dark bg-opacity-50 border-light rounded-4 shadow text-white text-decoration-none h-100 px-4">
                    <div className="d-flex justify-content-between mb-3">
                        <div className="rounded bg-gradient d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(to top right, #60a5fa, #a78bfa)', width: '40px', height: '40px' }}>
                          <span className="fw-bold text-white">{machine.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className={`rounded-circle ${machine.status === 'Running' ? 'bg-success' : 'bg-danger'}`} style={{ width: '10px', height: '10px' }}></div>
                      </div>
                      <h5 className="fw-bold mb-2">{machine.name}</h5>
                      <p className="text-white-50 small mb-3">{machine.description}</p>
                      <div className="d-flex justify-content-between">
                        <small className="text-white-50">📍 {machine.location}</small>
                        <span className="text-white-50">➔</span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'users' && (
          <section className="card bg-white text-dark border-light rounded-4 shadow p-4">
            <h2 className="h5 mb-4 d-flex align-items-center gap-2">
              <span>👥</span>
              <span>All Users</span>
            </h2>
            {users.length === 0 ? (
              <p>No users found.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-bordered">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Account Created</th>
                    </tr>
                  </thead>
                  <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.name.charAt(0).toUpperCase() + u.name.slice(1)}</td>
                      <td>{u.email}</td>
                      <td>{u.role.charAt(0).toUpperCase() + u.role.slice(1)}</td>
                      <td>{new Date(u.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}</td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
