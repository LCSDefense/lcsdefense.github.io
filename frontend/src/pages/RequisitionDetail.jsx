import { useState, useEffect, useRef } from 'react';
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
