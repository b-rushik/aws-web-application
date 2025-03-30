import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../../services/auth';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'setter', // Default role
    organization: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const attributes = {
      email: formData.email,
      name: formData.name,
      'custom:role': formData.role,
      'custom:organization': formData.organization
    };

    const result = await register(formData.email, formData.password, attributes);
    
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error.message || 'Registration failed');
    }
  };

  if (success) {
    return (
      <div className="auth-success">
        <h2>Registration Successful</h2>
        <p>Please check your email for verification code.</p>
        <button onClick={() => navigate('/')}>Return to Login</button>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <h2>Register</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="setter">Paper Setter</option>
            <option value="getter">Paper Getter</option>
          </select>
        </div>
        <div className="form-group">
          <label>Organization</label>
          <input
            type="text"
            name="organization"
            value={formData.organization}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;