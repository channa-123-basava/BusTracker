import { useState, useEffect } from 'react';
import { studentAPI, busAPI } from '../../api/services';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { PlusIcon, StudentIcon, EditIcon, TrashIcon, LinkIcon, SearchIcon, BusIcon } from '../../components/common/Icons';
import toast from 'react-hot-toast';

const defaultForm = { name: '', email: '', password: '', phone: '', studentId: '', department: '', year: '' };

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [editing, setEditing] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedBus, setSelectedBus] = useState('');
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, bRes] = await Promise.all([studentAPI.getAll(), busAPI.getAll()]);
      setStudents(sRes.data.data.students);
      setBuses(bRes.data.data.buses);
    } catch { toast.error('Failed to load'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.studentId || '').toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({ name: s.name, email: s.email, password: '', phone: s.phone || '', studentId: s.studentId || '', department: s.department || '', year: s.year || '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      if (editing) { await studentAPI.update(editing._id, data); toast.success('Student updated'); }
      else { await studentAPI.create(data); toast.success('Student added'); }
      setModalOpen(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await studentAPI.delete(deleteDialog.id);
      toast.success('Student deleted');
      setDeleteDialog({ open: false, id: null }); fetchData();
    } catch { toast.error('Delete failed'); } finally { setSaving(false); }
  };

  const handleAssignBus = async () => {
    if (!selectedBus) { toast.error('Select a bus'); return; }
    setSaving(true);
    try {
      await studentAPI.assignBus(selectedStudent._id, selectedBus);
      toast.success('Bus assigned');
      setAssignModal(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Information Technology', 'Chemical', 'Biotechnology'];

  if (loading) return <LoadingSpinner text="Loading students..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Management</h1>
          <p className="page-subtitle">{students.length} students registered</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <PlusIcon size={16} /> Add Student
        </button>
      </div>

      <div className="card px-4 py-3">
        <div className="relative">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input-field pl-9"
            placeholder="Search by name, email, or student ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-head">
              <tr>
                <th className="th">Name</th>
                <th className="th">Student ID</th>
                <th className="th">Email</th>
                <th className="th">Department</th>
                <th className="th">Year</th>
                <th className="th">Assigned Bus</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={<StudentIcon size={22} />} title="No students found" /></td></tr>
              ) : filtered.map((s) => (
                <tr key={s._id} className="tr-hover">
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-xs flex-shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-800">{s.name}</span>
                    </div>
                  </td>
                  <td className="td font-mono text-xs">{s.studentId || '-'}</td>
                  <td className="td text-slate-500 text-xs">{s.email}</td>
                  <td className="td text-slate-500">{s.department || '-'}</td>
                  <td className="td">{s.year ? `Year ${s.year}` : '-'}</td>
                  <td className="td">
                    {s.assignedBus
                      ? <span className="badge badge-blue"><BusIcon size={12} />{s.assignedBus.busNumber}</span>
                      : <span className="text-slate-300 text-xs">Not assigned</span>}
                  </td>
                  <td className="td">
                    <div className="flex gap-1.5">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors" title="Edit"><EditIcon size={14} /></button>
                      <button onClick={() => { setSelectedStudent(s); setSelectedBus(s.assignedBus?._id || ''); setAssignModal(true); }}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors" title="Assign Bus"><LinkIcon size={14} /></button>
                      <button onClick={() => setDeleteDialog({ open: true, id: s._id })}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors" title="Delete"><TrashIcon size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Student' : 'Add Student'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Full Name</label>
              <input className="input-field" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input-field" placeholder="john@college.edu" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Password {editing && '(leave blank to keep)'}</label>
              <input type="password" className="input-field" placeholder="Min 6 chars" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} />
            </div>
            <div>
              <label className="label">Student ID</label>
              <input className="input-field" placeholder="CS21001" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input-field" placeholder="+91 9876543210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Department</label>
              <select className="input-field" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                <option value="">Select</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <select className="input-field" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>
                <option value="">Select</option>
                {[1,2,3,4,5].map((y) => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Update' : 'Add Student'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={assignModal} onClose={() => setAssignModal(false)} title={`Assign Bus — ${selectedStudent?.name}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Select Bus</label>
            <select className="input-field" value={selectedBus} onChange={(e) => setSelectedBus(e.target.value)}>
              <option value="">No bus assigned</option>
              {buses.filter((b) => b.status === 'active').map((b) => (
                <option key={b._id} value={b._id}>{b.busNumber} - {b.assignedRoute?.routeName || 'No route'}</option>
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
        onConfirm={handleDelete} title="Delete Student" message="Remove this student from the system?" loading={saving} />
    </div>
  );
};

export default StudentsPage;
