import React, { useContext } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { AuthContext } from '../../context/AuthContext';

const Layout = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <div className="app-container">
      <Navbar />
      <div className="content-container">
        {isAuthenticated && <Sidebar />}
        <main className={`main-content ${isAuthenticated ? 'with-sidebar' : ''}`}>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
