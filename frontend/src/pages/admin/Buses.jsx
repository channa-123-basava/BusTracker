import { useState, useEffect } from 'react';
import { busAPI, routeAPI } from '../../api/services';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { PlusIcon, BusIcon, EditIcon, TrashIcon, LinkIcon } from '../../components/common/Icons';
import toast from 'react-hot-toast';

const defaultForm = { busNumber: '', registrationNumber: '', capacity: '', make: '', model: '', year: '', color: '#D97706', status: 'active' };

const BusesPage = () => {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignRouteModal, setAssignRouteModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [editing, setEditing] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [busRes, routeRes] = await Promise.all([busAPI.getAll(), routeAPI.getAll()]);
      setBuses(busRes.data.data.buses);
      setRoutes(routeRes.data.data.routes);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditing(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (bus) => {
    setEditing(bus);
    setForm({ busNumber: bus.busNumber, registrationNumber: bus.registrationNumber, capacity: bus.capacity, make: bus.make || '', model: bus.model || '', year: bus.year || '', color: bus.color || '#D97706', status: bus.status });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await busAPI.update(editing._id, form); toast.success('Bus updated'); }
      else { await busAPI.create(form); toast.success('Bus added'); }
      setModalOpen(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await busAPI.delete(deleteDialog.id);
      toast.success('Bus deleted');
      setDeleteDialog({ open: false, id: null }); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setSaving(false); }
  };

  const handleAssignRoute = async () => {
    if (!selectedRoute) { toast.error('Select a route'); return; }
    setSaving(true);
    try {
      await busAPI.assignRoute(selectedBus._id, selectedRoute);
      toast.success('Route assigned');
      setAssignRouteModal(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const statusBadge = { active: 'badge-green', inactive: 'badge-gray', maintenance: 'badge-yellow' };

  if (loading) return <LoadingSpinner text="Loading buses..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bus Management</h1>
          <p className="page-subtitle">{buses.length} buses registered</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <PlusIcon size={16} /> Add Bus
        </button>
      </div>

      <div className="table-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-head">
              <tr>
                <th className="th">Bus No.</th>
                <th className="th">Reg. No.</th>
                <th className="th">Capacity</th>
                <th className="th">Make / Model</th>
                <th className="th">Year</th>
                <th className="th">Color</th>
                <th className="th">Route</th>
                <th className="th">Driver</th>
                <th className="th">Status</th>
                <th className="th">Trip</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {buses.length === 0 ? (
                <tr><td colSpan={11}><EmptyState icon={<BusIcon size={22} />} title="No buses yet" description="Add your first bus to get started" /></td></tr>
              ) : buses.map((bus) => (
                <tr key={bus._id} className="tr-hover">
                  <td className="td font-semibold text-slate-900">{bus.busNumber}</td>
                  <td className="td font-mono text-xs">{bus.registrationNumber}</td>
                  <td className="td">{bus.capacity} seats</td>
                  <td className="td">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-900">{bus.make || '-'}</p>
                      <p className="text-xs text-slate-500">{bus.model || '-'}</p>
                    </div>
                  </td>
                  <td className="td">{bus.year || '-'}</td>
                  <td className="td">
                    <div className="inline-flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: bus.color || '#d1d5db' }} />
                      <span className="text-xs text-slate-500">{bus.color || '-'}</span>
                    </div>
                  </td>
                  <td className="td text-slate-500">{bus.assignedRoute?.routeName || <span className="text-slate-300">Unassigned</span>}</td>
                  <td className="td">{bus.assignedDriver?.name || <span className="text-slate-300">Unassigned</span>}</td>
                  <td className="td"><span className={statusBadge[bus.status]}>{bus.status}</span></td>
                  <td className="td">
                    {bus.isOnTrip
                      ? <span className="badge badge-green"><span className="status-dot bg-emerald-500" />On Trip</span>
                      : <span className="badge badge-gray">Idle</span>}
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(bus)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors" title="Edit"><EditIcon size={14} /></button>
                      <button onClick={() => { setSelectedBus(bus); setSelectedRoute(bus.assignedRoute?._id || ''); setAssignRouteModal(true); }}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors" title="Assign Route"><LinkIcon size={14} /></button>
                      <button onClick={() => setDeleteDialog({ open: true, id: bus._id })}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors" title="Delete"><TrashIcon size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Bus' : 'Add New Bus'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Bus Number</label>
              <input className="input-field" placeholder="BUS-01" value={form.busNumber} onChange={(e) => setForm({ ...form, busNumber: e.target.value })} required />
            </div>
            <div>
              <label className="label">Registration No.</label>
              <input className="input-field" placeholder="KA-01-AB-1234" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} required />
            </div>
            <div>
              <label className="label">Capacity</label>
              <input type="number" className="input-field" placeholder="40" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required min={1} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="label">Make</label>
              <input className="input-field" placeholder="Tata" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
            </div>
            <div>
              <label className="label">Model</label>
              <input className="input-field" placeholder="Starbus" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </div>
            <div>
              <label className="label">Year</label>
              <input type="number" className="input-field" placeholder="2022" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
            </div>
            <div>
              <label className="label">Map Marker Color</label>
              <div className="flex gap-2">
                <input type="color" className="w-12 h-10 rounded border border-slate-200 cursor-pointer" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                <input className="input-field flex-1" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2 justify-end">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Update Bus' : 'Add Bus'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={assignRouteModal} onClose={() => setAssignRouteModal(false)} title={`Assign Route — Bus ${selectedBus?.busNumber}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Select Route</label>
            <select className="input-field" value={selectedRoute} onChange={(e) => setSelectedRoute(e.target.value)}>
              <option value="">No route assigned</option>
              {routes.map((r) => <option key={r._id} value={r._id}>{r.routeNumber} - {r.routeName}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setAssignRouteModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAssignRoute} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Assign Route'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Bus"
        message="Are you sure you want to delete this bus? This will unassign all students and the driver."
        loading={saving}
      />
    </div>
  );
};

export default BusesPage;
