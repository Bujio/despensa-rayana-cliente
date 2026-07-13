import { X } from 'lucide-react';

export function Notice({ message, onClose }) {
  if (!message) return null;
  const isAccountWelcome = String(message).startsWith('Hola,') && String(message).includes('Mi cuenta');

  return (
    <div className={'notice' + (isAccountWelcome ? ' account-welcome-notice' : '')} role="status">
      <span>{message}</span>
      <button type="button" onClick={onClose} title="Cerrar aviso"><X size={16} /></button>
    </div>
  );
}
