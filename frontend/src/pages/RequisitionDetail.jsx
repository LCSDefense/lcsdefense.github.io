import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

const CUSTOMERS = ['AWS', 'NSA', 'C5ISR', 'Army G6', 'TAC', 'Raven', 'Other'];
const STATUSES = ['Open', 'Filled', 'On Hold', 'Cancelled'];
const PIPELINE_STAGES = [
  'Initial Contact', 'Interested', 'LCS Interview', 'Sent to Client',
  'Client Interview', 'Customer Approved', 'Offer', 'Hired', 'Customer Rejected', 'Rejected', 'Withdrawn',
];
const STAGE_COLORS = {
  'Initial Contact': 'bg-gray-200 text-gray-700',
  'Interested': 'bg-blue-100 text-blue-700',
  'LCS Interview': 'bg-yellow-100 text-yellow-700',
  'Sent to Client': 'bg-purple-100 text-purple-700',
  'Client Interview': 'bg-orange-100 text-orange-700',
  'Customer Approved': 'bg-green-100 text-green-700',
  'Offer': 'bg-green-100 text-green-700',
  'Hired': 'bg-green-200 text-green-800',
  'Customer Rejected': 'bg-red-100 text-red-700',
  'Rejected': 'bg-red-100 text-red-700',
  'Withdrawn': 'bg-gray-300 text-gray-600',
};

const STAGE_DATE_FIELD = {
  'Initial Contact': 'dateInitialContact',
  'Interested': 'dateInterested',
  'LCS Interview': 'dateLCSInterview',
  'Sent to Client': 'dateSentToClient',
  'Client Interview': 'dateClientInterview',
  'Customer Approved': 'dateClientInterview',
  'Offer': 'dateOffer',
  'Hired': 'dateFilled',
};

const DATE_LABELS = [
  { field: 'dateInitialContact', label: 'Initial Contact' },
  { field: 'dateInterested', label: 'Interested' },
  { field: 'dateLCSInterview', label: 'LCS Interview' },
  { field: 'dateSentToClient', label: 'Sent to Client' },
  { field: 'dateClientInterview', label: 'Client Interview' },
  { field: 'dateOffer', label: 'Offer' },
  { field: 'dateFilled', label: 'Hired / Filled' },
];

function toDateInput(val) {
  if (!val) return '';
  return new Date(val).toISOString().slice(0, 10);
}

function CandidateRow({ app: initialApp, onSaved }) {
  const [expanded, setExpanded] = useState(false);
  const [app, setApp] = useState(initialApp);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const update = (field, value) => {
    setApp((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleStageChange = (stage) => {
    const dateField = STAGE_DATE_FIELD[stage];
    setApp((prev) => ({
      ...prev,
      pipelineStage: stage,
      ...(dateField && !prev[dateField] ? { [dateField]: new Date().toISOString() } : {}),
    }));
    setDirty(true);
  };

  const handleDateChange = (field, value) => {
    update(field, value ? new Date(value).toISOString() : null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { candidate, requisition, onboardingRecord, id: _id, createdAt, updatedAt, ...data } = app;
      await api.updateApplication(app.id, data);
      setDirty(false);
      if (onSaved) onSaved();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-xs">{expanded ? '▼' : '▶'}</span>
          <div>
            <p className="font-medium text-sm text-gray-900">{app.candidate?.name}</p>
            <p className="text-xs text-gray-400">
              {app.candidate?.clearanceLevel || 'No clearance'}{app.recruiter ? ` · ${app.recruiter}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-xs text-amber-500 font-medium">Unsaved</span>}
          <span className={`text-xs px-2 py-1 rounded-full ${STAGE_COLORS[app.pipelineStage] || 'bg-gray-100'}`}>
            {app.pipelineStage}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 bg-slate-50/50 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Pipeline Stage</label>
              <select
                value={app.pipelineStage}
                onChange={(e) => handleStageChange(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white"
              >
                {PIPELINE_STAGES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Recruiter</label>
              <input
                value={app.recruiter || ''}
                onChange={(e) => update('recruiter', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Stage Dates</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {DATE_LABELS.map(({ field, label }) => (
                <div key={field}>
                  <label className="block text-xs text-gray-400 mb-1">{label}</label>
                  <input
                    type="date"
                    value={toDateInput(app[field])}
                    onChange={(e) => handleDateChange(field, e.target.value)}
                    className="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-navy/30 bg-white"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Comments / Notes</label>
            <textarea
              value={app.internalNotes || ''}
              onChange={(e) => update('internalNotes', e.target.value)}
              rows={3}
              placeholder="Add notes, comments, or status details..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Offer Amount</label>
            <input
              value={app.offerAmount || ''}
              onChange={(e) => update('offerAmount', e.target.value)}
              placeholder="e.g. $185,000"
              className="w-full sm:w-56 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 bg-white"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="bg-navy text-white px-4 py-1.5 rounded-lg hover:bg-navy/90 transition text-sm disabled:opacity-40"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <Link to={`/applications/${app.id}`} className="text-xs text-navy hover:underline">
              Full detail →
            </Link>
            {app.pipelineStage === 'Hired' && app.onboardingRecord && (
              <Link to={`/onboarding/${app.onboardingRecord.id}`} className="text-xs text-green-600 hover:underline">
                📋 Onboarding →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const EMPTY = {
  customer: 'AWS', position: '', hiringManager: '', contract: '', workLocation: '',
  status: 'Open', openSlots: 1, recruiter: '', notes: '', folderLink: '',
  requiredClearance: '', jobDescription: '', billRate: '', laborCategory: '', idNumber: '', customerPoc: '',
};

export default function RequisitionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const [form, setForm] = useState(EMPTY);
  const [applications, setApplications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateResults, setCandidateResults] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const docInputRef = useRef(null);

  useEffect(() => {
    if (!isNew) {
      api.getRequisition(id).then((data) => {
        setForm(data);
        setApplications(data.applications || []);
        setDocuments(data.documents || []);
      }).finally(() => setLoading(false));
    }
  }, [id]);

  useEffect(() => {
    if (!showAssignModal) {
      setCandidateSearch('');
      setCandidateResults([]);
      return;
    }
    if (candidateSearch.trim().length < 2) {
      setCandidateResults([]);
      return;
    }
    const timer = setTimeout(() => {
      api.getCandidates({ search: candidateSearch }).then(setCandidateResults).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [candidateSearch, showAssignModal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'openSlots' ? parseInt(value) || 0 : value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { applications: _, documents: __, ...data } = form;
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

  const handleDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingDoc(true);
    try {
      const uploaded = await api.uploadRequisitionDocument(id, file);
      setDocuments((prev) => [uploaded, ...prev]);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  const handleDeleteDoc = async (docId, filename) => {
    if (!confirm(`Delete "${filename}"?`)) return;
    try {
      await api.deleteRequisitionDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssignCandidate = async (candidate) => {
    setAssigning(true);
    try {
      await api.createApplication({ candidateId: candidate.id, requisitionId: parseInt(id) });
      const data = await api.getRequisition(id);
      setApplications(data.applications || []);
      setShowAssignModal(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Required Clearance</label>
            <input name="requiredClearance" value={form.requiredClearance || ''} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Bill Rate</label>
            <input name="billRate" value={form.billRate || ''} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Labor Category</label>
            <input name="laborCategory" value={form.laborCategory || ''} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">ID Number</label>
            <input name="idNumber" value={form.idNumber || ''} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Customer POC</label>
            <input name="customerPoc" value={form.customerPoc || ''} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">Job Description</label>
          <textarea name="jobDescription" value={form.jobDescription || ''} onChange={handleChange} rows={4}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
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

      {/* Documents Section */}
      {!isNew && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy">Documents ({documents.length})</h2>
            <div>
              <input
                ref={docInputRef}
                type="file"
                className="hidden"
                onChange={handleDocUpload}
              />
              <button
                onClick={() => docInputRef.current?.click()}
                disabled={uploadingDoc}
                className="bg-navy text-white px-4 py-2 rounded-lg hover:bg-navy/90 transition text-sm disabled:opacity-50"
              >
                {uploadingDoc ? 'Uploading...' : '+ Upload Document'}
              </button>
            </div>
          </div>
          {documents.length === 0 ? (
            <p className="text-gray-400 text-sm">No documents uploaded.</p>
          ) : (
            <div className="space-y-2">
              {documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-light-gray transition">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📎</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{d.filename}</p>
                      <p className="text-xs text-gray-400">
                        {formatBytes(d.size)} · Uploaded {new Date(d.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => api.openRequisitionDocument(d.id).catch(err => alert(err.message))}
                      className="text-xs px-3 py-1 rounded border border-navy text-navy hover:bg-navy hover:text-white transition"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteDoc(d.id, d.filename)}
                      className="text-xs px-3 py-1 rounded border border-red-300 text-red-500 hover:bg-red-50 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Candidate Pipeline */}
      {!isNew && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy">Candidate Pipeline ({applications.length})</h2>
            <button
              onClick={() => setShowAssignModal(true)}
              className="bg-navy text-white px-4 py-2 rounded-lg hover:bg-navy/90 transition text-sm"
            >
              + Add Candidate
            </button>
          </div>

          {/* Assign Candidate Modal */}
          {showAssignModal && (
            <div className="mb-4 p-4 border border-navy/20 rounded-lg bg-blue-50">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-navy">Search for a candidate to assign</p>
                <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
              </div>
              <input
                type="text"
                placeholder="Type name, email, or position..."
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 mb-2"
                autoFocus
              />
              {candidateResults.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {candidateResults.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleAssignCandidate(c)}
                      disabled={assigning}
                      className="w-full text-left px-3 py-2 rounded hover:bg-white transition text-sm flex items-center justify-between"
                    >
                      <div>
                        <span className="font-medium">{c.name}</span>
                        {c.currentPosition && <span className="text-gray-500 ml-2">· {c.currentPosition}</span>}
                      </div>
                      <span className="text-xs text-gray-400">{c.clearanceLevel || 'No clearance'}</span>
                    </button>
                  ))}
                </div>
              )}
              {candidateSearch.length >= 2 && candidateResults.length === 0 && (
                <p className="text-xs text-gray-400">No candidates found</p>
              )}
            </div>
          )}

          {applications.length === 0 ? (
            <p className="text-gray-400 text-sm">No candidates yet</p>
          ) : (
            <div className="space-y-2">
              {applications.map((app) => (
                <CandidateRow
                  key={app.id}
                  app={app}
                  onSaved={() => api.getRequisition(id).then((data) => setApplications(data.applications || []))}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
