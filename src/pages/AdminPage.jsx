import React from 'react';
import AdminDashboard from '../components/Dashboard/AdminDashboard';
import Notifications from '../components/Notifications';

const AdminPage = () => {
  return (
    <div className="admin-page">
      <AdminDashboard />
      <Notifications />
    </div>
  );
};

export default AdminPage;