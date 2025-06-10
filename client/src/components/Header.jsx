import { Link, useLocation } from 'react-router-dom';

function Header({ user, onLogout }) {
  const location = useLocation();

  if (!user) return null;

  return (
    <div className="header py-3">
      {/* Main White Card Header */}
      <div className="bg-white rounded-4 shadow p-4 container mt-4">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
          
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-circle d-flex align-items-center justify-content-center shadow"
              style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(to top right, #facc15, #fb923c)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.25rem',
              }}
            >
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="h5 fw-bold text-dark mb-0">
                Hi, {user.name.charAt(0).toUpperCase() + user.name.slice(1)}! 👋
              </h1>
              <p className="text-muted mb-0">
                Company: <span className="fw-semibold">{user.company_name}</span>
              </p>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="d-flex flex-wrap gap-2">
            <button 
              onClick={onLogout}
              className="btn btn-outline-secondary"
            >
              🚪 Logout
            </button>

            {user.role === 'admin' && location.pathname !== '/create-user' && (
              <Link to="/create-user" className="btn btn-success text-white">
                👤 Add User
              </Link>
            )}

            {location.pathname !== '/machines/create' && (
              <Link to="/machines/create" className="btn btn-primary text-white">
                🏭 Add Machine
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;
