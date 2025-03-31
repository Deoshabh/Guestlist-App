import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Bhaujan Vypar</Link>
      </div>
      <div className="navbar-menu">
        <div className="navbar-end">
          {isAuthenticated ? (
            <>
              <span className="navbar-item">Welcome, {user.name}</span>
              <Link to="/dashboard" className="navbar-item">Dashboard</Link>
              <Link to="/guests" className="navbar-item">Guests</Link>
              <Link to="/templates" className="navbar-item">Templates</Link>
              <button onClick={handleLogout} className="navbar-item button">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-item">Login</Link>
              <Link to="/register" className="navbar-item">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
