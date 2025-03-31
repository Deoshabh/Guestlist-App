import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const Header = ({ darkMode, toggleDarkMode }) => {
  const location = useLocation();
  
  // Navigation links with active state
  const navLinks = [
    { path: '/', label: 'Dashboard' },
    { path: '/guests', label: 'Guests' },
    { path: '/groups', label: 'Groups' },
    { path: '/whatsapp-templates', label: 'WhatsApp Templates' },
  ];
  
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm mb-6 rounded-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">Guest Manager</h1>
            </div>
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-4">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`${
                    location.pathname === link.path
                      ? 'border-blue-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center">
            <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          </div>
        </div>
      </div>
      
      {/* Mobile menu - shown below sm breakpoint */}
      <div className="sm:hidden border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between overflow-x-auto">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`${
                location.pathname === link.path
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400'
              } flex-1 text-center py-2 px-1 border-b-2 text-xs font-medium whitespace-nowrap`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;