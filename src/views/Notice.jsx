import { X } from 'lucide-react';

export function Notice({ message, onClose }) {
  if (!message) return null;

  const closeNotice = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClose?.();
  };

  return (
    <div className="notice" role="status">
      <span>{message}</span>
      <button
        type="button"
        onClick={closeNotice}
        onPointerDown={closeNotice}
        title="Cerrar aviso"
        aria-label="Cerrar aviso"
      >
        <X size={16} />
      </button>
    </div>
  );
}
