import { useState, useEffect } from 'react';
import { driverAPI, busAPI } from '../../api/services';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { PlusIcon, DriverIcon, EditIcon, TrashIcon, PhoneIcon, IdCardIcon, BusIcon, CloseIcon } from '../../components/common/Icons';
import toast from 'react-hot-toast';

const defaultForm = { name: '', password: '', phone: '', licenseNumber: '' };

const DriversPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [editing, setEditing] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedBus, setSelectedBus] = useState('');
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dRes, bRes] = await Promise.all([driverAPI.getAll(), busAPI.getAll()]);
      setDrivers(dRes.data.data.drivers);
      setBuses(bRes.data.data.buses);
    } catch { toast.error('Failed to load'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditing(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (d) => {
    setEditing(d);
    setForm({ name: d.name, password: '', phone: d.phone || '', licenseNumber: d.licenseNumber || '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      if (editing) { await driverAPI.update(editing._id, data); toast.success('Driver updated'); }
      else { await driverAPI.create(data); toast.success('Driver added'); }
      setModalOpen(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await driverAPI.delete(deleteDialog.id);
      toast.success('Driver deleted');
      setDeleteDialog({ open: false, id: null }); fetchData();
    } catch { toast.error('Delete failed'); } finally { setSaving(false); }
  };

  const handleAssignBus = async () => {
    if (!selectedBus) { toast.error('Select a bus'); return; }
    setSaving(true);
    try {
      await driverAPI.assignBus(selectedDriver._id, selectedBus);
      toast.success('Bus assigned to driver');
      setAssignModal(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner text="Loading drivers..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Driver Management</h1>
          <p className="page-subtitle">{drivers.length} drivers registered</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <PlusIcon size={16} /> Add Driver
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drivers.length === 0 ? (
          <div className="col-span-3"><EmptyState icon={<DriverIcon size={22} />} title="No drivers yet" description="Add drivers to assign them to buses" /></div>
        ) : drivers.map((driver) => (
          <div key={driver._id} className="card p-5 hover:shadow-card-hover transition-all">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-11 h-11 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-lg flex-shrink-0">
                {driver.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{driver.name}</p>
                <p className="text-xs text-slate-500 truncate">{driver.phone || 'No phone number'}</p>
              </div>
              {driver.isOnTrip && <span className="badge badge-green text-xs flex-shrink-0">On Trip</span>}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <PhoneIcon size={14} className="text-slate-400 flex-shrink-0" />
                <span>{driver.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <IdCardIcon size={14} className="text-slate-400 flex-shrink-0" />
                <span className="font-mono text-xs">{driver.licenseNumber || 'No license'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <BusIcon size={14} className="text-slate-400 flex-shrink-0" />
                <span>{driver.assignedBusDriver?.busNumber || <span className="text-slate-400">No bus assigned</span>}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
              <button onClick={() => openEdit(driver)} className="btn-secondary flex-1 text-xs py-1.5"><EditIcon size={13} /> Edit</button>
              <button onClick={() => { setSelectedDriver(driver); setSelectedBus(driver.assignedBusDriver?._id || ''); setAssignModal(true); }}
                className="flex-1 text-xs py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-colors inline-flex items-center justify-center gap-1.5">
                <BusIcon size={13} /> Assign Bus
              </button>
              <button onClick={() => setDeleteDialog({ open: true, id: driver._id })}
                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"><TrashIcon size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Driver' : 'Add Driver'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Full Name</label>
              <input className="input-field" placeholder="Ramesh Kumar" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Password {editing && '(leave blank to keep)'}</label>
              <input type="password" className="input-field" placeholder="Min 6 chars" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="tel" className="input-field" placeholder="+91 9876543210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div>
              <label className="label">License Number</label>
              <input className="input-field" placeholder="KA-01-20220001234" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Update' : 'Add Driver'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={assignModal} onClose={() => setAssignModal(false)} title={`Assign Bus — ${selectedDriver?.name}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Select Bus</label>
            <select className="input-field" value={selectedBus} onChange={(e) => setSelectedBus(e.target.value)}>
              <option value="">No bus assigned</option>
              {buses.filter((b) => b.status === 'active').map((b) => (
                <option key={b._id} value={b._id}>{b.busNumber} - {b.registrationNumber}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setAssignModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAssignBus} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Assign Bus'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}
        onConfirm={handleDelete} title="Delete Driver" message="Remove this driver from the system?" loading={saving} />
    </div>
  );
};

export default DriversPage;
