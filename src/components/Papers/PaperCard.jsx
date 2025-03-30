import React from 'react';
import StatusIndicator from '../Common/StatusIndicator';

const PaperCard = ({ paper, type }) => {
  const renderSetterView = () => (
    <>
      <h3>{paper.title}</h3>
      <p>Subject: {paper.subject}</p>
      <p>Deadline: {new Date(paper.deadline).toLocaleDateString()}</p>
      <StatusIndicator status={paper.status} />
      {paper.feedback && <p>Feedback: {paper.feedback}</p>}
    </>
  );

  const renderGetterView = () => (
    <>
      <h3>Request: {paper.subject}</h3>
      <p>Expert: {paper.expertName || 'Not assigned'}</p>
      <p>Status: <StatusIndicator status={paper.status} /></p>
      {paper.downloadUrl && (
        <a href={paper.downloadUrl} target="_blank" rel="noopener noreferrer">
          Download Paper
        </a>
      )}
    </>
  );

  const renderAdminView = () => (
    <>
      <h3>{paper.title || `Request from ${paper.requesterName}`}</h3>
      <p>Subject: {paper.subject}</p>
      <p>Setter: {paper.setterName}</p>
      <p>Deadline: {new Date(paper.deadline).toLocaleDateString()}</p>
      <StatusIndicator status={paper.status} />
    </>
  );

  const renderContent = () => {
    switch(type) {
      case 'setter': return renderSetterView();
      case 'getter': return renderGetterView();
      case 'admin': return renderAdminView();
      default: return null;
    }
  };

  return (
    <div className="paper-card">
      {renderContent()}
    </div>
  );
};

export default PaperCard;