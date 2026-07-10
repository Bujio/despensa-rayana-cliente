import { useEffect, useState } from 'react';

const STORAGE_KEY = 'despensa-cookie-consent';

function readConsent() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}

export function CookieConsent() {
  const [consent, setConsent] = useState(() => readConsent());
  const [configuring, setConfiguring] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!consent) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  }, [consent]);

  if (consent) return null;

  const save = (nextConsent) => {
    setConsent({
      essential: true,
      analytics: Boolean(nextConsent.analytics),
      marketing: Boolean(nextConsent.marketing),
      savedAt: new Date().toISOString(),
    });
  };

  return (
    <aside className="cookie-banner" role="dialog" aria-label="Configuración de cookies">
      <div>
        <strong>Privacidad y cookies</strong>
        <p>
          Usamos cookies técnicas necesarias. Las analíticas o marketing solo se activarían con tu consentimiento.
        </p>
        {configuring && (
          <div className="cookie-options">
            <label className="check-row">
              <input type="checkbox" checked readOnly />
              Técnicas necesarias
            </label>
            <label className="check-row">
              <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} />
              Analíticas
            </label>
            <label className="check-row">
              <input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} />
              Marketing
            </label>
          </div>
        )}
      </div>
      <div className="cookie-actions">
        <button className="secondary small" type="button" onClick={() => save({})}>Rechazar</button>
        <button className="secondary small" type="button" onClick={() => setConfiguring((value) => !value)}>Configurar</button>
        <button className="primary small" type="button" onClick={() => save(configuring ? { analytics, marketing } : { analytics: true, marketing: true })}>
          Aceptar
        </button>
      </div>
    </aside>
  );
}
