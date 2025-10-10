import React from 'react';
import './Profile.css';

// Profile Page Component
const Profile = () => {
  // Profile data
  const profileData = {
    name: "Mai Quốc Bình",
    class: "Student at PTIT",
    msv: "B22DCCN082_D22HTTT05",
    email: "BinhMQ.B22DCCN082@stu.ptit.edu.vn",
    phone: "0886827975",
    profileImage: "/images/profile.jpg"
  };

  // Links
  const links = {
    github: "https://github.com/maiquocbinh",
    pdfReport: "https://example.com/report.pdf",
    postman: "https://documenter.postman.com/view/your-api-doc",
    swagger: "https://your-api.com/swagger"
  };

  const handleLinkClick = (url) => {
    window.open(url, '_blank');
  };

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="header">
        <h1 className="page-title">Profile</h1>
        <div className="bell">🔔</div>
      </div>
      
      {/* Profile Content */}
      <div className="profile-content">
        <div className="profile-card">
          {/* Profile Picture */}
          <div className="profile-picture">
            <img src="/profile.png" alt="Mai Quốc Bình" />
          </div>
          
          {/* User Info */}
          <div className="user-info">
            <h2 className="user-name">{profileData.name}</h2>
            <p className="user-class">{profileData.class}</p>
          </div>
          
          {/* Contact Info */}
          <div className="contact-info">
            <div className="info-field">
              <label>MSV</label>
              <div className="info-box">{profileData.msv}</div>
            </div>
            
            <div className="info-field">
              <label>Email</label>
              <div className="info-box">{profileData.email}</div>
            </div>
            
            <div className="info-field">
              <label>Phone</label>
              <div className="info-box">{profileData.phone}</div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="action-buttons">
            <div className="button-row">
              <button 
                className="action-btn github-btn"
                onClick={() => handleLinkClick(links.github)}
              >
                GitHub
                <span className="external-icon">↗</span>
              </button>
              
              <button 
                className="action-btn pdf-btn"
                onClick={() => handleLinkClick(links.pdfReport)}
              >
                Download PDF
              </button>
            </div>
            
            <div className="button-row">
              <button 
                className="action-btn update-btn"
                onClick={() => handleLinkClick(links.postman)}
              >
                Update Profile
                <span className="external-icon">↗</span>
              </button>
            </div>
          </div>
          
          {/* API Documentation Link */}
          <div className="api-links">
            <h3>API Documentation</h3>
            <div className="api-link">
              <a 
                href={links.swagger}
                target="_blank"
                rel="noopener noreferrer"
                className="api-link-text"
              >
                View API Docs
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;