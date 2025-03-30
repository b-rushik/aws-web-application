import React, { useState } from 'react';
import { submitPaper } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';

const PaperForm = ({ onSubmit }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    deadline: '',
    file: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, file: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formPayload = new FormData();
    formPayload.append('title', formData.title);
    formPayload.append('subject', formData.subject);
    formPayload.append('description', formData.description);
    formPayload.append('deadline', formData.deadline);
    formPayload.append('file', formData.file);
    formPayload.append('setterId', user.username);
    formPayload.append('setterName', user.attributes.name);

    const result = await submitPaper(formPayload);
    onSubmit(result);
  };

  return (
    <form className="paper-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
        />
      </div>
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
        <label>Description</label>
        <textarea
          name="description"
          value={formData.description}
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
      <div className="form-group">
        <label>Upload Paper</label>
        <input
          type="file"
          onChange={handleFileChange}
          required
        />
      </div>
      <button type="submit">Submit Paper</button>
    </form>
  );
};

export default PaperForm;