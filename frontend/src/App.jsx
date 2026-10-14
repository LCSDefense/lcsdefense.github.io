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

export default function App() {
  return (
    <Layout>
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
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}
