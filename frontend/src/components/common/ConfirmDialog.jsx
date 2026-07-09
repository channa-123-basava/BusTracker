import Modal from './Modal';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', loading = false }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="text-slate-600 text-sm mb-6">{message}</p>
    <div className="flex gap-3 justify-end">
      <button onClick={onClose} className="btn-secondary text-sm py-2">Cancel</button>
      <button
        onClick={onConfirm}
        disabled={loading}
        className="btn-danger text-sm py-2"
      >
        {loading ? 'Processing...' : confirmLabel}
      </button>
    </div>
  </Modal>
);

export default ConfirmDialog;
