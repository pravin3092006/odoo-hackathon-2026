import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', confirmVariant = 'btn-danger', loading = false }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
          <button className={`btn ${confirmVariant}`} onClick={onConfirm} disabled={loading}>
            {loading ? <span className="spinner" /> : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-3 items-start">
        <div style={{ width: 40, height: 40, borderRadius: 'var(--radius)', background: 'var(--color-danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <AlertTriangle size={20} style={{ color: 'var(--color-danger)' }} />
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, paddingTop: 4 }}>{message}</p>
      </div>
    </Modal>
  );
}
