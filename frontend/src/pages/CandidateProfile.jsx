import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

const CLEARANCES = ['None', 'Secret', 'TS', 'TS/SCI', 'TS/SCI w/FSP'];

const EMPTY = {
  name: '', email: '', phone: '', homeAddress: '', currentPosition: '', currentCompany: '',
  clearanceLevel: 'None', clearanceConfirmedBy: '', salaryExpectation: '', sourcedBy: '',
  resumeLink: '', linkedInUrl: '', notes: '',
};

export default function CandidateProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const [form, setForm] = useState(EMPTY);
  const [applications, setApplications] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew) {
      api.getCandidate(id).then((data) => {
        setForm(data);
        setApplications(data.applications || []);
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { applications: _, ...data } = form;
      if (isNew) {
        const created = await api.createCandidate(data);
        navigate(`/candidates/${created.id}`, { replace: true });
      } else {
        const { id: _id, createdAt, updatedAt, ...updateData } = data;
        await api.updateCandidate(id, updateData);
      }
    } catch (err) {
      alert(err.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/candidates')} className="text-navy hover:underline text-sm">
          ← Candidates
        </button>
        <h1 className="text-2xl font-bold text-navy">
          {isNew ? 'New Candidate' : form.name}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Name *</label>
            <input name="name" value={form.name} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <input name="email" value={form.email || ''} onChange={handleChange} type="email"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
            <input name="phone" value={form.phone || ''} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Current Position</label>
            <input name="currentPosition" value={form.currentPosition || ''} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Current Company</label>
            <input name="currentCompany" value={form.currentCompany || ''} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Clearance Level</label>
            <select name="clearanceLevel" value={form.clearanceLevel || 'None'} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30">
              {CLEARANCES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Clearance Confirmed By</label>
            <input name="clearanceConfirmedBy" value={form.clearanceConfirmedBy || ''} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Salary Expectation</label>
            <input name="salaryExpectation" value={form.salaryExpectation || ''} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Sourced By</label>
            <input name="sourcedBy" value={form.sourcedBy || ''} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Home Address</label>
            <input name="homeAddress" value={form.homeAddress || ''} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Resume Link</label>
            <input name="resumeLink" value={form.resumeLink || ''} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">LinkedIn</label>
            <input name="linkedInUrl" value={form.linkedInUrl || ''} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
          <textarea name="notes" value={form.notes || ''} onChange={handleChange} rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
        </div>
        <div className="mt-4">
          <button onClick={handleSave} disabled={saving}
            className="bg-navy text-white px-6 py-2 rounded-lg hover:bg-navy/90 transition text-sm disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {!isNew && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-navy mb-4">Applications ({applications.length})</h2>
          {applications.length === 0 ? (
            <p className="text-gray-400 text-sm">No applications</p>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <Link
                  key={app.id}
                  to={`/applications/${app.id}`}
                  className="flex items-center justify-between p-3 rounded hover:bg-light-gray transition block"
                >
                  <div>
                    <p className="font-medium text-sm">{app.requisition.position}</p>
                    <p className="text-xs text-gray-500">{app.requisition.customer}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                    {app.pipelineStage}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
