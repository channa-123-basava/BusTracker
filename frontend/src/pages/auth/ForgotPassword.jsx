import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResetLink('');
    try {
      const res = await forgotPassword(email);
      toast.success('If the email exists, a reset link has been sent.');
      setEmail('');
      if (res?.resetUrl) {
        setResetLink(res.resetUrl);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8 text-white">
          <h1 className="text-2xl font-display font-bold">Forgot Password</h1>
          <p className="text-slate-400 mt-2 text-sm">Enter your email to receive a reset link.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 py-3 text-sm">
              {loading ? 'Sending reset link...' : 'Send reset link'}
            </button>
          </form>

          {resetLink && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-slate-700">
              <p className="font-medium text-green-800">Development reset link</p>
              <p className="break-all mt-2">{resetLink}</p>
            </div>
          )}

          <p className="text-center text-sm text-slate-500 mt-5">
            Remembered your password?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
