import React from 'react';
import PaperSetterDashboard from '../components/Dashboard/PaperSetterDashboard';
import Notifications from '../components/Notifications';

const PaperSetterPage = () => {
  return (
    <div className="paper-setter-page">
      <PaperSetterDashboard />
      <Notifications />
    </div>
  );
};

export default PaperSetterPage;