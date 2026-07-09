import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StudentIcon } from '../../components/common/Icons';
import toast from 'react-hot-toast';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', studentId: '', department: '', year: '',
  });
  const [loading, setLoading] = useState(false);

  const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Information Technology', 'Chemical', 'Biotechnology'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword, ...data } = form;
      await register({ ...data, year: Number(data.year) });
      toast.success('Account created successfully');
      navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg text-white">
            <StudentIcon size={22} />
          </div>
          <h1 className="text-xl font-display font-bold text-white">Student Registration</h1>
          <p className="text-slate-400 mt-1 text-sm">College Bus Tracker</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Full Name</label>
                <input className="input-field" placeholder="John Doe" value={form.name} onChange={set('name')} required />
              </div>
              <div className="col-span-2">
                <label className="label">College Email</label>
                <input type="email" className="input-field" placeholder="john@college.edu" value={form.email} onChange={set('email')} required />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" className="input-field" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input type="password" className="input-field" placeholder="Repeat password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
              </div>
              <div>
                <label className="label">Student ID</label>
                <input className="input-field" placeholder="CS21001" value={form.studentId} onChange={set('studentId')} />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input type="tel" className="input-field" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
              </div>
              <div>
                <label className="label">Department</label>
                <select className="input-field" value={form.department} onChange={set('department')}>
                  <option value="">Select Department</option>
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Year</label>
                <select className="input-field" value={form.year} onChange={set('year')}>
                  <option value="">Select Year</option>
                  {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 py-3 text-sm">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
