import React from 'react';

const StatusIndicator = ({ status }) => {
  const getStatusClass = () => {
    switch(status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'completed': return 'status-completed';
      default: return '';
    }
  };

  return (
    <span className={`status-indicator ${getStatusClass()}`}>
      {status || 'unknown'}
    </span>
  );
};

export default StatusIndicator;