import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-info">
          <p>&copy; 2026 AllStats. Live Esports Data.</p>
        </div>
        <div className="footer-links">
          <a href="#">About</a>
          <a href="#">API Documentation</a>
          <a href="#">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
