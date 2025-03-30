import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import PaperCard from '../Papers/PaperCard';
import PaperRequestForm from '../Papers/PaperRequestForm';
import { fetchPapers } from '../../services/api';

const PaperGetterDashboard = () => {
  const { user } = useAuth();
  const [papers, setPapers] = useState([]);
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    const loadPapers = async () => {
      if (user) {
        const userPapers = await fetchPapers(user.username, 'getter');
        setPapers(userPapers);
      }
    };
    loadPapers();
  }, [user]);

  const handleRequestPaper = (newRequest) => {
    setPapers([...papers, newRequest]);
    setShowRequestForm(false);
  };

  return (
    <div className="dashboard">
      <h2>Paper Getter Dashboard</h2>
      <button onClick={() => setShowRequestForm(!showRequestForm)}>
        {showRequestForm ? 'Cancel' : 'Request New Paper'}
      </button>
      
      {showRequestForm && (
        <PaperRequestForm onSubmit={handleRequestPaper} />
      )}
      
      <div className="papers-list">
        {papers.map(paper => (
          <PaperCard 
            key={paper.id} 
            paper={paper} 
            type="getter" 
          />
        ))}
      </div>
    </div>
  );
};

export default PaperGetterDashboard;