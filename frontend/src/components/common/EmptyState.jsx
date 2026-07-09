import { InfoIcon } from './Icons';

const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
      {icon || <InfoIcon size={22} />}
    </div>
    <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
    {description && <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>}
    {action && action}
  </div>
);

export default EmptyState;
