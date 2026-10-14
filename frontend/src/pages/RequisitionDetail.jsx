import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

const CUSTOMERS = ['AWS', 'NSA', 'C5ISR', 'Army G6', 'TAC', 'Raven', 'Other'];
const STATUSES = ['Open', 'Filled', 'On Hold', 'Cancelled'];
const STAGE_COLORS = {
  'Initial Contact': 'bg-gray-200 text-gray-700',
  'Interested': 'bg-blue-100 text-blue-700',
  'LCS Interview': 'bg-yellow-100 text-yellow-700',
  'Sent to Client': 'bg-purple-100 text-purple-700',
  'Client Interview': 'bg-orange-100 text-orange-700',
  'Offer': 'bg-green-100 text-green-700',
  'Hired': 'bg-green-200 text-green-800',
  'Rejected': 'bg-red-100 text-red-700',
  'Withdrawn': 'bg-gray-300 text-gray-600',
};

const EMPTY = {
  customer: 'AWS', position: '', hiringManager: '', contract: '', workLocation: '',
  status: 'Open', openSlots: 1, recruiter: '', notes: '', folderLink: '',
};

export default function RequisitionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const [form, setForm] = useState(EMPTY);
  const [applications, setApplications] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew) {
      api.getRequisition(id).then((data) => {
        setForm(data);
        setApplications(data.applications || []);
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'openSlots' ? parseInt(value) || 0 : value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { applications: _, ...data } = form;
      if (isNew) {
        const created = await api.createRequisition(data);
        navigate(`/requisitions/${created.id}`, { replace: true });
      } else {
        const { id: _id, createdAt, updatedAt, ...updateData } = data;
        await api.updateRequisition(id, updateData);
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
        <button onClick={() => navigate('/requisitions')} className="text-navy hover:underline text-sm">
          ← Requisitions
        </button>
        <h1 className="text-2xl font-bold text-navy">
          {isNew ? 'New Requisition' : `${form.position} — ${form.customer}`}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Customer *</label>
            <select name="customer" value={form.customer} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30">
              {CUSTOMERS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Position *</label>
            <input name="position" value={form.position} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
            <select name="status" value={form.status} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30">
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Hiring Manager</label>
            <input name="hiringManager" value={form.hiringManager || ''} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Contract</label>
            <input name="contract" value={form.contract || ''} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Work Location</label>
            <input name="workLocation" value={form.workLocation || ''} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Open Slots</label>
            <input name="openSlots" type="number" value={form.openSlots} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Recruiter</label>
            <input name="recruiter" value={form.recruiter || ''} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Folder Link</label>
            <input name="folderLink" value={form.folderLink || ''} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
          <textarea name="notes" value={form.notes || ''} onChange={handleChange} rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={handleSave} disabled={saving}
            className="bg-navy text-white px-6 py-2 rounded-lg hover:bg-navy/90 transition text-sm disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Candidate Pipeline */}
      {!isNew && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-navy mb-4">Candidate Pipeline ({applications.length})</h2>
          {applications.length === 0 ? (
            <p className="text-gray-400 text-sm">No candidates yet</p>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <Link
                  key={app.id}
                  to={`/applications/${app.id}`}
                  className="flex items-center justify-between p-3 rounded hover:bg-light-gray transition block"
                >
                  <div>
                    <p className="font-medium text-sm">{app.candidate.name}</p>
                    <p className="text-xs text-gray-500">
                      {app.candidate.clearanceLevel || 'No clearance'} • {app.candidate.currentPosition || 'N/A'}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${STAGE_COLORS[app.pipelineStage] || 'bg-gray-100'}`}>
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
