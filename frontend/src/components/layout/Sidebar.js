import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Sidebar = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const location = useLocation();

  // If not authenticated, don't show sidebar
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="sidebar">
      <ul className="sidebar-menu">
        <li className={location.pathname === '/dashboard' ? 'active' : ''}>
          <Link to="/dashboard">
            <i className="fas fa-tachometer-alt"></i>
            <span>Dashboard</span>
          </Link>
        </li>
        <li className={location.pathname === '/guests' ? 'active' : ''}>
          <Link to="/guests">
            <i className="fas fa-users"></i>
            <span>Guests</span>
          </Link>
        </li>
        <li className={location.pathname === '/templates' ? 'active' : ''}>
          <Link to="/templates">
            <i className="fas fa-comment-alt"></i>
            <span>Message Templates</span>
          </Link>
        </li>
        <li className={location.pathname === '/settings' ? 'active' : ''}>
          <Link to="/settings">
            <i className="fas fa-cog"></i>
            <span>Settings</span>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
