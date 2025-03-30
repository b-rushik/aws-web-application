import React, { useState } from 'react';
import { requestPaper } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';

const PaperRequestForm = ({ onSubmit }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    subject: '',
    level: 'undergraduate',
    requirements: '',
    deadline: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const requestData = {
      ...formData,
      requesterId: user.username,
      requesterName: user.attributes.name,
      organization: user.attributes['custom:organization']
    };

    const result = await requestPaper(requestData);
    onSubmit(result);
  };

  return (
    <form className="request-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Subject</label>
        <input
          type="text"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label>Level</label>
        <select
          name="level"
          value={formData.level}
          onChange={handleChange}
          required
        >
          <option value="undergraduate">Undergraduate</option>
          <option value="graduate">Graduate</option>
          <option value="phd">PhD</option>
        </select>
      </div>
      <div className="form-group">
        <label>Requirements</label>
        <textarea
          name="requirements"
          value={formData.requirements}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-group">
        <label>Deadline</label>
        <input
          type="date"
          name="deadline"
          value={formData.deadline}
          onChange={handleChange}
          required
        />
      </div>
      <button type="submit">Submit Request</button>
    </form>
  );
};

export default PaperRequestForm;