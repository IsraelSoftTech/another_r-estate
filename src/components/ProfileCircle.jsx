import React from 'react';
import { FaUser } from 'react-icons/fa';

const ProfileCircle = () => {
  return (
    <div
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'scale(1.05)';
        e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'scale(1)';
        e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
      }}
      title="User Profile"
    >
      <FaUser size={18} />
    </div>
  );
};

export default ProfileCircle; 