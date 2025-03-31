import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; {new Date().getFullYear()} Bhaujan Vypar. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
