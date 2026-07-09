import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BusIcon } from '../components/common/Icons';

const NotFound = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const home = user ? (user.role === 'admin' ? '/admin' : user.role === 'driver' ? '/driver' : '/student') : '/login';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6 text-slate-400">
          <BusIcon size={36} />
        </div>
        <h1 className="text-6xl font-display font-bold text-slate-900 mb-4">404</h1>
        <p className="text-xl text-slate-600 mb-2">Page not found</p>
        <p className="text-slate-400 mb-8">The page you're looking for doesn't exist.</p>
        <button onClick={() => navigate(home)} className="btn-primary px-8 py-3 text-sm">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotFound;
