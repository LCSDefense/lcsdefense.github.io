import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

const PIPELINE_STAGES = [
  'Initial Contact', 'Interested', 'LCS Interview', 'Sent to Client',
  'Client Interview', 'Offer', 'Hired', 'Rejected', 'Withdrawn',
];

const CLIENT_STATUSES = ['N/A', 'Shortlisted', 'Interview Scheduled', 'Rejected', 'Pending'];

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.getApplication(id).then(setApp).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setApp((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { candidate, requisition, onboardingRecord, id: _id, createdAt, updatedAt, ...data } = app;
      await api.updateApplication(id, data);
    } catch (err) {
      alert(err.message);
    }
    setSaving(false);
  };

  const handleCreateOnboarding = async () => {
    try {
      const record = await api.createOnboardingRecord({
        applicationId: parseInt(id),
        employeeName: app.candidate.name,
        personalEmail: app.candidate.email,
        personalPhone: app.candidate.phone,
        homeAddress: app.candidate.homeAddress,
        position: app.requisition.position,
        customer: app.requisition.customer,
        hiringManager: app.requisition.hiringManager,
        contract: app.requisition.contract,
        workLocation: app.requisition.workLocation,
      });
      navigate(`/onboarding/${record.id}`);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;
  if (!app) return <div className="text-center py-12 text-red-500">Application not found</div>;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-navy hover:underline text-sm">← Back</button>
        <h1 className="text-2xl font-bold text-navy">
          {app.candidate?.name} → {app.requisition?.position}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-navy mb-4">Application Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Pipeline Stage</label>
              <select name="pipelineStage" value={app.pipelineStage} onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30">
                {PIPELINE_STAGES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Client Status</label>
              <select name="clientStatus" value={app.clientStatus || 'N/A'} onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30">
                {CLIENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Alignment %</label>
              <input name="alignmentPct" type="number" value={app.alignmentPct || ''} onChange={(e) =>
                setApp((prev) => ({ ...prev, alignmentPct: e.target.value ? parseInt(e.target.value) : null }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Recruiter</label>
              <input name="recruiter" value={app.recruiter || ''} onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Offer Amount</label>
              <input name="offerAmount" value={app.offerAmount || ''} onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">Job Description</label>
            <textarea name="jobDescription" value={app.jobDescription || ''} onChange={handleChange} rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">Internal Notes</label>
            <textarea name="internalNotes" value={app.internalNotes || ''} onChange={handleChange} rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>

          <div className="mt-4 flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="bg-navy text-white px-6 py-2 rounded-lg hover:bg-navy/90 transition text-sm disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
            {app.pipelineStage === 'Hired' && !app.onboardingRecord && (
              <button onClick={handleCreateOnboarding}
                className="bg-gold text-white px-6 py-2 rounded-lg hover:bg-gold/90 transition text-sm">
                🚀 Create Onboarding
              </button>
            )}
            {app.onboardingRecord && (
              <Link to={`/onboarding/${app.onboardingRecord.id}`}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition text-sm">
                View Onboarding →
              </Link>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-navy mb-4">Timeline</h2>
          <div className="space-y-4">
            {[
              { label: 'Opened', date: app.dateOpened },
              { label: 'Initial Contact', date: app.dateInitialContact },
              { label: 'Interested', date: app.dateInterested },
              { label: 'LCS Interview', date: app.dateLCSInterview },
              { label: 'Sent to Client', date: app.dateSentToClient },
              { label: 'Client Interview', date: app.dateClientInterview },
              { label: 'Offer', date: app.dateOffer },
              { label: 'Filled', date: app.dateFilled },
            ].map(({ label, date }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${date ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-gray-400">{formatDate(date)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Links</h3>
            <div className="space-y-1">
              <Link to={`/candidates/${app.candidateId}`} className="text-sm text-navy hover:underline block">
                👤 {app.candidate?.name}
              </Link>
              <Link to={`/requisitions/${app.requisitionId}`} className="text-sm text-navy hover:underline block">
                📋 {app.requisition?.position} ({app.requisition?.customer})
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
