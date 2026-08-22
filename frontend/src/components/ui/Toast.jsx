import { useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useHRMS } from '../../context/HRMSContext';

const ICONS = {
  success: <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />,
  error:   <AlertCircle  size={18} style={{ color: 'var(--color-danger)' }} />,
  warning: <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />,
  info:    <Info size={18} style={{ color: 'var(--color-info)' }} />,
};

function ToastItem({ toast }) {
  const { actions } = useHRMS();
  return (
    <div className={`toast ${toast.type || 'info'}`}>
      <span className="toast-icon">{ICONS[toast.type] || ICONS.info}</span>
      <div className="toast-content">
        {toast.title && <div className="toast-title">{toast.title}</div>}
        <div className="toast-message">{toast.message}</div>
      </div>
      <button className="toast-close" onClick={() => actions.removeToast(toast.id)}>
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { state } = useHRMS();
  return (
    <div className="toast-container">
      {state.toasts.map(t => <ToastItem key={t.id} toast={t} />)}
    </div>
  );
}
