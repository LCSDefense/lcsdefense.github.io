import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Requisitions from './pages/Requisitions';
import RequisitionDetail from './pages/RequisitionDetail';
import Candidates from './pages/Candidates';
import CandidateProfile from './pages/CandidateProfile';
import ApplicationDetail from './pages/ApplicationDetail';
import Onboarding from './pages/Onboarding';
import OnboardingDetail from './pages/OnboardingDetail';
import Reports from './pages/Reports';
import ResumeScanner from './pages/ResumeScanner';
import Login from './pages/Login';
import { clearToken } from './api';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('lcs_token'));

  const handleLogin = (t) => setToken(t);
  const handleLogout = () => { clearToken(); setToken(null); };

  if (!token) return <Login onLogin={handleLogin} />;

  return (
    <Layout onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/requisitions" element={<Requisitions />} />
        <Route path="/requisitions/new" element={<RequisitionDetail />} />
        <Route path="/requisitions/:id" element={<RequisitionDetail />} />
        <Route path="/candidates" element={<Candidates />} />
        <Route path="/candidates/new" element={<CandidateProfile />} />
        <Route path="/candidates/:id" element={<CandidateProfile />} />
        <Route path="/applications/:id" element={<ApplicationDetail />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/onboarding/:id" element={<OnboardingDetail />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/resume-scanner" element={<ResumeScanner />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}
