import { X } from 'lucide-react';

export function Notice({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="notice" role="status">
      <span>{message}</span>
      <button type="button" onClick={onClose} title="Cerrar aviso"><X size={16} /></button>
    </div>
  );
}
