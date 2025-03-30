import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import PaperCard from '../Papers/PaperCard';
import StatusIndicator from '../Common/StatusIndicator';
import { fetchAllPapers, updatePaperStatus } from '../../services/api';

const AdminDashboard = () => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPapers = async () => {
      const allPapers = await fetchAllPapers();
      setPapers(allPapers);
      setLoading(false);
    };
    loadPapers();
  }, []);

  const handleStatusChange = async (paperId, newStatus, feedback = '') => {
    const updatedPaper = await updatePaperStatus(paperId, newStatus, feedback);
    setPapers(papers.map(p => p.id === paperId ? updatedPaper : p));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h2>Admin Dashboard</h2>
      <div className="admin-papers-list">
        {papers.map(paper => (
          <div key={paper.id} className="admin-paper-card">
            <PaperCard paper={paper} type="admin" />
            <StatusIndicator status={paper.status} />
            <div className="admin-actions">
              <button onClick={() => handleStatusChange(paper.id, 'approved')}>
                Approve
              </button>
              <button onClick={() => handleStatusChange(paper.id, 'rejected', 'Needs improvement')}>
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;