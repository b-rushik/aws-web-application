import React from 'react';
import PaperGetterDashboard from '../components/Dashboard/PaperGetterDashboard';
import Notifications from '../components/Notifications';

const PaperGetterPage = () => {
  return (
    <div className="paper-getter-page">
      <PaperGetterDashboard />
      <Notifications />
    </div>
  );
};

export default PaperGetterPage;