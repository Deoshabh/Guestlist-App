import React from 'react';

export default function Notification({ message, type = 'success' }) {
  const bgColors = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700'
  };
  
  return (
    <div className={`${bgColors[type]} px-4 py-3 rounded relative mb-4 border`} role="alert">
      <span className="block sm:inline">{message}</span>
    </div>
  );
}
