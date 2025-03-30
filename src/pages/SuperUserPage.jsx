import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { fetchAllPapers } from '../../services/api';

const SuperUserPage = () => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    role: '',
    dateFrom: '',
    dateTo: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAllPapers();
      setPapers(data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    // Filtering logic would be implemented here
    loadData();
  };

  React.useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="super-user-page">
      <h2>Super User Dashboard</h2>
      
      <div className="filters">
        <select name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        
        <select name="role" value={filters.role} onChange={handleFilterChange}>
          <option value="">All Roles</option>
          <option value="setter">Setters</option>
          <option value="getter">Getters</option>
        </select>
        
        <input 
          type="date" 
          name="dateFrom" 
          value={filters.dateFrom} 
          onChange={handleFilterChange} 
          placeholder="From date"
        />
        
        <input 
          type="date" 
          name="dateTo" 
          value={filters.dateTo} 
          onChange={handleFilterChange} 
          placeholder="To date"
        />
        
        <button onClick={applyFilters}>Apply Filters</button>
      </div>
      
      {loading ? (
        <p>Loading data...</p>
      ) : (
        <div className="audit-log">
          <h3>System Activity</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {papers.map(paper => (
                <tr key={paper.id}>
                  <td>{new Date(paper.createdAt).toLocaleString()}</td>
                  <td>{paper.setterName || paper.requesterName}</td>
                  <td>{paper.setterName ? 'Setter' : 'Getter'}</td>
                  <td>{paper.setterName ? 'Paper Submission' : 'Paper Request'}</td>
                  <td>{paper.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SuperUserPage;