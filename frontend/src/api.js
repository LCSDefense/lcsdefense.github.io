const API_BASE = import.meta.env.VITE_API_URL || 'https://backend-production-45d16.up.railway.app';

function getToken() {
  return localStorage.getItem('lcs_token');
}

export function clearToken() {
  localStorage.removeItem('lcs_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (res.status === 401) {
    clearToken();
    window.location.href = '/'; // Redirect to login
    throw new Error('Session expired — please sign in again');
  }
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Dashboard
  getDashboard: () => request('/api/dashboard'),

  // Requisitions
  getRequisitions: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/api/requisitions${q ? '?' + q : ''}`);
  },
  getRequisition: (id) => request(`/api/requisitions/${id}`),
  createRequisition: (data) => request('/api/requisitions', { method: 'POST', body: JSON.stringify(data) }),
  updateRequisition: (id, data) => request(`/api/requisitions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRequisition: (id) => request(`/api/requisitions/${id}`, { method: 'DELETE' }),

  // Candidates
  getCandidates: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/api/candidates${q ? '?' + q : ''}`);
  },
  getCandidate: (id) => request(`/api/candidates/${id}`),
  createCandidate: (data) => request('/api/candidates', { method: 'POST', body: JSON.stringify(data) }),
  updateCandidate: (id, data) => request(`/api/candidates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCandidate: (id) => request(`/api/candidates/${id}`, { method: 'DELETE' }),

  // Candidate Resumes
  getResumes: (candidateId) => request(`/api/candidates/${candidateId}/resumes`),
  uploadResume: (candidateId, file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return fetch(`${API_BASE}/api/candidates/${candidateId}/resumes`, {
      method: 'POST',
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      return data;
    });
  },
  deleteResume: (resumeId) => request(`/api/candidates/resumes/${resumeId}`, { method: 'DELETE' }),
  getResumeUrl: (resumeId) => `${API_BASE}/api/candidates/resumes/${resumeId}/file`,

  // Applications
  getApplications: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/api/applications${q ? '?' + q : ''}`);
  },
  getApplication: (id) => request(`/api/applications/${id}`),
  createApplication: (data) => request('/api/applications', { method: 'POST', body: JSON.stringify(data) }),
  updateApplication: (id, data) => request(`/api/applications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  promoteApplication: (id) => request(`/api/applications/${id}/promote`, { method: 'POST' }),

  // Onboarding
  getOnboardingRecords: () => request('/api/onboarding'),
  getOnboardingRecord: (id) => request(`/api/onboarding/${id}`),
  createOnboardingRecord: (data) => request('/api/onboarding', { method: 'POST', body: JSON.stringify(data) }),
  updateOnboardingRecord: (id, data) => request(`/api/onboarding/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleChecklist: (id, data) => request(`/api/onboarding/checklist/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};
