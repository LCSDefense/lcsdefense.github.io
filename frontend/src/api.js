const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
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
