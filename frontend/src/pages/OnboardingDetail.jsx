import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

const STATUSES = ['Not Started', 'In Progress', 'Complete'];
const CATEGORY_COLORS = {
  HR: 'border-blue-500',
  Legal: 'border-purple-500',
  IT: 'border-green-500',
  Security: 'border-red-500',
  Facilities: 'border-yellow-500',
  Admin: 'border-gray-500',
  Benefits: 'border-teal-500',
};

export default function OnboardingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.getOnboardingRecord(id).then(setRecord).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRecord((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { application, checklistItems, id: _id, createdAt, updatedAt, ...data } = record;
      await api.updateOnboardingRecord(id, data);
    } catch (err) {
      alert(err.message);
    }
    setSaving(false);
  };

  const toggleItem = async (item) => {
    try {
      await api.toggleChecklist(item.id, { isComplete: !item.isComplete });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;
  if (!record) return <div className="text-center py-12 text-red-500">Not found</div>;

  // Group checklist by category
  const grouped = {};
  (record.checklistItems || []).forEach((item) => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  const total = record.checklistItems?.length || 0;
  const done = record.checklistItems?.filter((i) => i.isComplete).length || 0;

  const fields = [
    ['employeeName', 'Employee Name'], ['personalEmail', 'Personal Email'], ['personalPhone', 'Personal Phone'],
    ['homeAddress', 'Home Address'], ['hiringManager', 'Hiring Manager'], ['position', 'Position'],
    ['customer', 'Customer'], ['contract', 'Contract'], ['taskOrderNumber', 'Task Order #'],
    ['workLocation', 'Work Location'], ['requiredClearance', 'Required Clearance'],
    ['clearanceLevelVerification', 'Clearance Verification'], ['salary', 'Salary'],
    ['signOnBonus', 'Sign-on Bonus'], ['offerType', 'Offer Type'], ['awsIdNumber', 'AWS ID #'],
    ['awsLaborCategory', 'AWS Labor Cat'], ['awsTargetRate', 'AWS Target Rate'],
    ['customerPOC', 'Customer POC'], ['dob', 'DOB'], ['ssn', 'SSN'],
    ['salaryDotComRange', 'Salary.com Range'], ['desiredSalary', 'Desired Salary'],
    ['estimatedTargetRate', 'Est. Target Rate'], ['billRate', 'Bill Rate'],
    ['lcsEmailAddress', 'LCS Email'], ['milEmailAddress', 'MIL Email'],
    ['apgBuildingNumber', 'APG Building #'], ['company', 'Company'],
    ['c5isrDirectorate', 'C5ISR Directorate'], ['c5isrDivision', 'C5ISR Division'],
    ['c5isrBranch', 'C5ISR Branch'], ['effortProjectName', 'Effort/Project'],
    ['personalCell', 'Personal Cell'], ['workCell', 'Work Cell'],
    ['officeNumber', 'Office #'], ['cacRequired', 'CAC Required'],
    ['cacType', 'CAC Type'], ['cacEdipi', 'CAC EDIPI'],
    ['visitRequestRequired', 'Visit Request Required'],
    ['fsoInfo', 'FSO Info'], ['gtlInfo', 'GTL Info'],
    ['branchChief', 'Branch Chief'], ['lcsManager', 'LCS Manager'],
    ['onSiteAdmin', 'On-Site Admin'], ['plc', 'PLC'],
    ['laborCategory', 'Labor Category'], ['laborChargeCode', 'Labor Charge Code'],
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/onboarding')} className="text-navy hover:underline text-sm">
          ← Onboarding
        </button>
        <h1 className="text-2xl font-bold text-navy">{record.employeeName}</h1>
        <span className="text-sm text-gray-400">({done}/{total} complete)</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Employee Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy">Employee Details</h2>
            <select name="onboardingStatus" value={record.onboardingStatus} onChange={handleChange}
              className="border rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30">
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fields.map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                <input
                  name={key}
                  value={record[key] || ''}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-navy/30"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
              <input
                name="startDate"
                type="date"
                value={record.startDate ? record.startDate.split('T')[0] : ''}
                onChange={(e) => setRecord(prev => ({ ...prev, startDate: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-navy/30"
              />
            </div>
            <div className="flex items-center gap-4 col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="campusBadgeRequired" checked={record.campusBadgeRequired || false} onChange={handleChange} />
                Campus Badge Required
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="saarsRequired" checked={record.saarsRequired || false} onChange={handleChange} />
                SAARS Required
              </label>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">Job Description</label>
            <textarea name="jobDescription" value={record.jobDescription || ''} onChange={handleChange} rows={3}
              className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-navy/30" />
          </div>

          <button onClick={handleSave} disabled={saving}
            className="mt-4 bg-navy text-white px-6 py-2 rounded-lg hover:bg-navy/90 transition text-sm disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Details'}
          </button>
        </div>

        {/* Right: Checklist */}
        <div className="bg-white rounded-lg shadow-sm p-6 max-h-[80vh] overflow-y-auto">
          <h2 className="text-lg font-semibold text-navy mb-4">
            Onboarding Checklist
            <span className="text-sm font-normal text-gray-400 ml-2">({done}/{total})</span>
          </h2>

          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-gold rounded-full h-3 transition-all" style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
            </div>
          </div>

          <div className="space-y-6">
            {Object.entries(grouped).map(([category, items]) => {
              const catDone = items.filter((i) => i.isComplete).length;
              return (
                <div key={category} className={`border-l-4 ${CATEGORY_COLORS[category] || 'border-gray-300'} pl-4`}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    {category} <span className="font-normal text-gray-400">({catDone}/{items.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-start gap-2 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={item.isComplete}
                          onChange={() => toggleItem(item)}
                          className="mt-0.5 accent-navy"
                        />
                        <span className={`text-sm ${item.isComplete ? 'line-through text-gray-400' : 'text-gray-700'} group-hover:text-navy`}>
                          {item.task}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
