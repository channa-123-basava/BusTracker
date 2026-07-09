import { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { notificationAPI } from '../../api/services';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { BellIcon, TripIcon, AlertTriangleIcon, CheckCircleIcon, SpeakerIcon } from '../../components/common/Icons';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const typeIcon = {
  trip_started: <TripIcon size={16} />, trip_ended: <CheckCircleIcon size={16} />,
  bus_delayed: <AlertTriangleIcon size={16} />, bus_arrived: <CheckCircleIcon size={16} />,
  general: <BellIcon size={16} />, alert: <AlertTriangleIcon size={16} />,
};
const typeBg = {
  trip_started: 'bg-emerald-50 text-emerald-600', trip_ended: 'bg-slate-100 text-slate-500',
  bus_delayed: 'bg-amber-50 text-amber-600', bus_arrived: 'bg-emerald-50 text-emerald-600',
  general: 'bg-blue-50 text-blue-600', alert: 'bg-red-50 text-red-600',
};

const AdminNotifications = () => {
  const { notifications, markRead, markAllRead } = useNotifications();
  const user = JSON.parse(localStorage.getItem('cbt_user') || '{}');
  const [composeOpen, setComposeOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'general', isGlobal: true });
  const [saving, setSaving] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await notificationAPI.create(form);
      toast.success('Notification broadcast successfully');
      setComposeOpen(false);
      setForm({ title: '', message: '', type: 'general', isGlobal: true });
    } catch { toast.error('Failed to send'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Manage and broadcast alerts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={markAllRead} className="btn-secondary text-sm">Mark All Read</button>
          <button onClick={() => setComposeOpen(true)} className="btn-primary text-sm">
            <SpeakerIcon size={15} /> Broadcast
          </button>
        </div>
      </div>

      <div className="card divide-y divide-slate-50">
        {notifications.length === 0 ? (
          <EmptyState icon={<BellIcon size={22} />} title="No notifications yet" />
        ) : notifications.map((n) => {
          const isRead = n.readBy?.includes(user?._id);
          return (
            <div
              key={n._id}
              className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors ${!isRead ? 'bg-blue-50/50' : ''}`}
              onClick={() => !isRead && markRead(n._id)}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${typeBg[n.type] || 'bg-slate-100 text-slate-500'}`}>
                {typeIcon[n.type] || <BellIcon size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${!isRead ? 'text-slate-900' : 'text-slate-700'}`}>{n.title}</p>
                  {!isRead && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-400">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                  {n.isGlobal && <span className="badge badge-blue text-xs">Global</span>}
                  <span className={`badge text-xs ${n.type === 'alert' ? 'badge-red' : 'badge-gray'}`}>{n.type.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={composeOpen} onClose={() => setComposeOpen(false)} title="Broadcast Notification" size="md">
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input-field" placeholder="Notification title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea className="input-field min-h-[100px] resize-none" placeholder="Notification message..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="general">General</option>
                <option value="alert">Alert</option>
                <option value="bus_delayed">Bus Delayed</option>
                <option value="bus_arrived">Bus Arrived</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" id="global" checked={form.isGlobal} onChange={(e) => setForm({ ...form, isGlobal: e.target.checked })} className="w-4 h-4 text-primary-600 rounded" />
              <label htmlFor="global" className="text-sm font-medium text-slate-700">Broadcast to all users</label>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setComposeOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Sending...' : 'Send Notification'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminNotifications;
