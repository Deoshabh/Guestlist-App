import React from 'react';

const HomePage = () => {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to Bhaujan Vypar</h1>
          <p>Your platform for business growth and success</p>
        </div>
      </section>
      
      <section className="features">
        <div className="feature-card">
          <h3>Business Networking</h3>
          <p>Connect with other businesses and entrepreneurs</p>
        </div>
        <div className="feature-card">
          <h3>Resource Sharing</h3>
          <p>Access educational resources and business tools</p>
        </div>
        <div className="feature-card">
          <h3>Community Support</h3>
          <p>Get support from a thriving community</p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
