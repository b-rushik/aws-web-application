import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import PaperCard from '../Papers/PaperCard';
import PaperForm from '../Papers/PaperForm';
import StatusIndicator from '../Common/StatusIndicator';
import { fetchPapers } from '../../services/api';

const PaperSetterDashboard = () => {
  const { user } = useAuth();
  const [papers, setPapers] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const loadPapers = async () => {
      if (user) {
        const userPapers = await fetchPapers(user.username, 'setter');
        setPapers(userPapers);
      }
    };
    loadPapers();
  }, [user]);

  const handleSubmitPaper = (newPaper) => {
    setPapers([...papers, newPaper]);
    setShowForm(false);
  };

  return (
    <div className="dashboard">
      <h2>Paper Setter Dashboard</h2>
      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'Create New Paper'}
      </button>
      
      {showForm && <PaperForm onSubmit={handleSubmitPaper} />}
      
      <div className="papers-list">
        {papers.map(paper => (
          <PaperCard 
            key={paper.id} 
            paper={paper} 
            type="setter" 
          />
        ))}
      </div>
    </div>
  );
};

export default PaperSetterDashboard;