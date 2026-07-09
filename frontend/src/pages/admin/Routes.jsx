import { useState, useEffect } from 'react';
import { routeAPI } from '../../api/services';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { PlusIcon, RouteIcon, EditIcon, TrashIcon, MapPinIcon, ClockIcon } from '../../components/common/Icons';
import toast from 'react-hot-toast';

const defaultForm = {
  routeName: '', routeNumber: '', distance: '', estimatedDuration: '',
  departureTime: '', returnTime: '',
  source: { name: '', latitude: '', longitude: '' },
  destination: { name: '', latitude: '', longitude: '' },
};

const RoutesPage = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [editing, setEditing] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const res = await routeAPI.getAll();
      setRoutes(res.data.data.routes);
    } catch { toast.error('Failed to load routes'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchRoutes(); }, []);

  const openCreate = () => { setEditing(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (r) => {
    setEditing(r);
    setForm({
      routeName: r.routeName, routeNumber: r.routeNumber,
      distance: r.distance || '', estimatedDuration: r.estimatedDuration || '',
      departureTime: r.departureTime || '', returnTime: r.returnTime || '',
      source: { name: r.source.name, latitude: r.source.latitude, longitude: r.source.longitude },
      destination: { name: r.destination.name, latitude: r.destination.latitude, longitude: r.destination.longitude },
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        distance: form.distance ? Number(form.distance) : undefined,
        estimatedDuration: form.estimatedDuration ? Number(form.estimatedDuration) : undefined,
        source: { ...form.source, latitude: Number(form.source.latitude), longitude: Number(form.source.longitude) },
        destination: { ...form.destination, latitude: Number(form.destination.latitude), longitude: Number(form.destination.longitude) },
      };
      if (editing) { await routeAPI.update(editing._id, payload); toast.success('Route updated'); }
      else { await routeAPI.create(payload); toast.success('Route created'); }
      setModalOpen(false); fetchRoutes();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await routeAPI.delete(deleteDialog.id);
      toast.success('Route deleted');
      setDeleteDialog({ open: false, id: null }); fetchRoutes();
    } catch { toast.error('Delete failed'); } finally { setSaving(false); }
  };

  const setNested = (path, value) => {
    const [parent, child] = path.split('.');
    if (child) setForm((f) => ({ ...f, [parent]: { ...f[parent], [child]: value } }));
    else setForm((f) => ({ ...f, [parent]: value }));
  };

  if (loading) return <LoadingSpinner text="Loading routes..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Route Management</h1>
          <p className="page-subtitle">{routes.length} routes configured</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <PlusIcon size={16} /> Add Route
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {routes.length === 0 ? (
          <div className="col-span-3"><EmptyState icon={<RouteIcon size={22} />} title="No routes yet" description="Create routes to assign to buses" /></div>
        ) : routes.map((route) => (
          <div key={route._id} className="card p-5 hover:shadow-card-hover transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{route.routeNumber}</span>
                <h3 className="font-semibold text-slate-900 mt-1.5">{route.routeName}</h3>
              </div>
              <span className={route.isActive ? 'badge badge-green' : 'badge badge-gray'}>
                {route.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="space-y-2 text-sm text-slate-600 mb-4">
              <div className="flex gap-2 items-center">
                <span className="status-dot bg-green-500" />
                <span className="truncate">{route.source.name}</span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="status-dot bg-red-500" />
                <span className="truncate">{route.destination.name}</span>
              </div>
              <div className="flex gap-4 text-xs text-slate-500 pt-1">
                {route.distance && <span className="inline-flex items-center gap-1"><MapPinIcon size={12} />{route.distance} km</span>}
                {route.estimatedDuration && <span className="inline-flex items-center gap-1"><ClockIcon size={12} />{route.estimatedDuration} min</span>}
                {route.stops?.length > 0 && <span>{route.stops.length} stops</span>}
              </div>
              {(route.departureTime || route.returnTime) && (
                <div className="flex gap-4 text-xs text-slate-500">
                  {route.departureTime && <span>Departs {route.departureTime}</span>}
                  {route.returnTime && <span>Returns {route.returnTime}</span>}
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-50">
              <button onClick={() => { setSelectedRoute(route); setViewModal(true); }}
                className="btn-secondary flex-1 text-xs py-1.5">View Details</button>
              <button onClick={() => openEdit(route)} className="flex-1 text-xs py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium transition-colors inline-flex items-center justify-center gap-1.5">
                <EditIcon size={13} /> Edit
              </button>
              <button onClick={() => setDeleteDialog({ open: true, id: route._id })}
                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"><TrashIcon size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Route' : 'Add Route'} size="lg">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Route Name</label>
              <input className="input-field" placeholder="City Center Express" value={form.routeName} onChange={(e) => setNested('routeName', e.target.value)} required />
            </div>
            <div>
              <label className="label">Route Number</label>
              <input className="input-field" placeholder="R-01" value={form.routeNumber} onChange={(e) => setNested('routeNumber', e.target.value)} required />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">Source (Start Point)</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="label">Stop Name</label>
                <input className="input-field" placeholder="College Gate" value={form.source.name} onChange={(e) => setNested('source.name', e.target.value)} required />
              </div>
              <div>
                <label className="label">Latitude</label>
                <input type="number" step="any" className="input-field" placeholder="12.9716" value={form.source.latitude} onChange={(e) => setNested('source.latitude', e.target.value)} required />
              </div>
              <div>
                <label className="label">Longitude</label>
                <input type="number" step="any" className="input-field" placeholder="77.5946" value={form.source.longitude} onChange={(e) => setNested('source.longitude', e.target.value)} required />
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">Destination (End Point)</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="label">Stop Name</label>
                <input className="input-field" placeholder="Bus Stand" value={form.destination.name} onChange={(e) => setNested('destination.name', e.target.value)} required />
              </div>
              <div>
                <label className="label">Latitude</label>
                <input type="number" step="any" className="input-field" placeholder="12.9716" value={form.destination.latitude} onChange={(e) => setNested('destination.latitude', e.target.value)} required />
              </div>
              <div>
                <label className="label">Longitude</label>
                <input type="number" step="any" className="input-field" placeholder="77.5946" value={form.destination.longitude} onChange={(e) => setNested('destination.longitude', e.target.value)} required />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Distance (km)</label>
              <input type="number" step="0.1" className="input-field" placeholder="15" value={form.distance} onChange={(e) => setNested('distance', e.target.value)} />
            </div>
            <div>
              <label className="label">Duration (minutes)</label>
              <input type="number" className="input-field" placeholder="45" value={form.estimatedDuration} onChange={(e) => setNested('estimatedDuration', e.target.value)} />
            </div>
            <div>
              <label className="label">Departure Time</label>
              <input className="input-field" placeholder="08:00 AM" value={form.departureTime} onChange={(e) => setNested('departureTime', e.target.value)} />
            </div>
            <div>
              <label className="label">Return Time</label>
              <input className="input-field" placeholder="05:00 PM" value={form.returnTime} onChange={(e) => setNested('returnTime', e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Update Route' : 'Create Route'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title={`Route: ${selectedRoute?.routeName}`} size="md">
        {selectedRoute && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Route Number</p>
                <p className="font-mono font-semibold">{selectedRoute.routeNumber}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Distance</p>
                <p className="font-semibold">{selectedRoute.distance || '-'} km</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-green-600 mb-1">Source</p>
                <p className="font-semibold text-slate-800">{selectedRoute.source.name}</p>
                <p className="text-xs text-slate-500 font-mono">{selectedRoute.source.latitude}, {selectedRoute.source.longitude}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-red-600 mb-1">Destination</p>
                <p className="font-semibold text-slate-800">{selectedRoute.destination.name}</p>
                <p className="text-xs text-slate-500 font-mono">{selectedRoute.destination.latitude}, {selectedRoute.destination.longitude}</p>
              </div>
            </div>
            {selectedRoute.stops?.length > 0 && (
              <div>
                <p className="font-medium text-slate-700 mb-2">Stops ({selectedRoute.stops.length})</p>
                <div className="space-y-1">
                  {selectedRoute.stops.sort((a, b) => a.order - b.order).map((stop, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs bg-slate-50 rounded px-3 py-2">
                      <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">{stop.order}</span>
                      <span className="font-medium">{stop.name}</span>
                      {stop.estimatedTime && <span className="ml-auto text-slate-500">{stop.estimatedTime}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}
        onConfirm={handleDelete} title="Delete Route" message="Delete this route? Buses assigned to it will lose their route." loading={saving} />
    </div>
  );
};

export default RoutesPage;
