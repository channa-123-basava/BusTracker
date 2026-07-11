import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { EyeIcon, EyeOffIcon, SpinnerIcon } from '../../components/common/Icons';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.identifier, form.password);
      toast.success(`Welcome back, ${user.name}`);
      const dest = from || (user.role === 'admin' ? '/admin' : user.role === 'driver' ? '/driver' : '/student');
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demo) => {
    setForm({ identifier: demo.identifier, password: demo.password });
    setLoading(true);
    try {
      const user = await login(demo.identifier, demo.password);
      toast.success(`Welcome back, ${user.name}`);
      const dest = user.role === 'admin' ? '/admin' : user.role === 'driver' ? '/driver' : '/student';
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Demo login is unavailable. Start the backend and try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoLogins = [
    { role: 'Admin', identifier: 'admin@college.edu', password: 'admin123' },
    { role: 'Driver', identifier: 'driver@college.edu', password: 'driver123' },
    { role: 'Student', identifier: 'student@college.edu', password: 'student123' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 6v6m0 0H3l-1 4v2h1.5M8 12h8m0-6v6m0 0h5l1 4v2h-1.5M8 18a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0m5 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0M3 6h18a1 1 0 0 1 1 1v5H2V7a1 1 0 0 1 1-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-display font-bold text-white">College Bus Tracker</h1>
          <p className="text-slate-400 mt-2 text-sm">Real-time transport tracking system</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-display font-bold text-slate-900 mb-6">Sign in to continue</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email or Phone Number</label>
              <input
                type="text"
                className="input-field"
                placeholder="you@college.edu or +91 9876543210"
                value={form.identifier}
                onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 py-3 text-sm">
              {loading ? (
                <><SpinnerIcon size={16} className="animate-spin" /> Signing in...</>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-slate-500">
            <div className="mb-3">
              <Link to="/forgot-password" className="text-primary-600 font-medium hover:text-primary-700">
                Forgot password?
              </Link>
            </div>
            New student?{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:text-primary-700">
              Create an account
            </Link>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center mb-3 font-medium uppercase tracking-wide">Demo Access</p>
            <div className="flex gap-2">
              {demoLogins.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  disabled={loading}
                  onClick={() => handleDemoLogin(d)}
                  className="flex-1 text-xs py-2 px-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium transition-colors"
                >
                  {d.role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
