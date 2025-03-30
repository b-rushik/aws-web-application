const API_BASE_URL = process.env.API_BASE_URL || 'https://your-api-gateway-url.amazonaws.com/prod';

export const fetchPapers = async (userId, role) => {
  const response = await fetch(`${API_BASE_URL}/papers?userId=${userId}&role=${role}`);
  if (!response.ok) throw new Error('Failed to fetch papers');
  return await response.json();
};

export const fetchAllPapers = async () => {
  const response = await fetch(`${API_BASE_URL}/papers/all`);
  if (!response.ok) throw new Error('Failed to fetch papers');
  return await response.json();
};

export const updatePaperStatus = async (paperId, status, feedback = '') => {
  const response = await fetch(`${API_BASE_URL}/papers/${paperId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, feedback }),
  });
  if (!response.ok) throw new Error('Failed to update paper status');
  return await response.json();
};

export const submitPaper = async (paperData) => {
  const response = await fetch(`${API_BASE_URL}/papers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(paperData),
  });
  if (!response.ok) throw new Error('Failed to submit paper');
  return await response.json();
};

export const requestPaper = async (requestData) => {
  const response = await fetch(`${API_BASE_URL}/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  });
  if (!response.ok) throw new Error('Failed to request paper');
  return await response.json();
};