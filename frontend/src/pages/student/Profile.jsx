import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/services';
import toast from 'react-hot-toast';

const StudentProfile = () => {
  const { user } = useAuth();
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('New passwords do not match'); return; }
    setSaving(true);
    try {
      await authAPI.updatePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password updated successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update password'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Your account information</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-slate-900">{user?.name}</h2>
            <p className="text-slate-500 text-sm">{user?.email}</p>
            <span className="badge badge-blue mt-1">Student</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: 'Student ID', value: user?.studentId || '-' },
            { label: 'Phone', value: user?.phone || '-' },
            { label: 'Department', value: user?.department || '-' },
            { label: 'Year', value: user?.year ? `Year ${user.year}` : '-' },
            { label: 'Assigned Bus', value: user?.assignedBus?.busNumber || '-' },
            { label: 'Account Status', value: user?.isActive ? 'Active' : 'Inactive' },
          ].map((item) => (
            <div key={item.label} className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">{item.label}</p>
              <p className="font-semibold text-slate-800">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display font-bold text-slate-900 mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input-field"
              value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input-field" placeholder="Min 6 characters"
              value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} required minLength={6} />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input-field"
              value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} required />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Updating...' : 'Update Password'}</button>
        </form>
      </div>
    </div>
  );
};

export default StudentProfile;
