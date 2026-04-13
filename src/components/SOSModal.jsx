import { useState, useEffect } from 'react';
import styles from './SOSModal.module.css';

export default function SOSModal({ isOpen, onClose, onConfirm, userCoords }) {
  const [countdown, setCountdown] = useState(5);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (!isOpen) { setCountdown(5); setActivated(false); return; }
    if (activated) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); handleConfirm(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, activated]);

  const handleConfirm = () => {
    setActivated(true);
    onConfirm({
      timestamp: new Date().toISOString(),
      coords: userCoords,
      message: 'SafeRoute SOS Emergency Activated',
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modal} glass`}>
        {!activated ? (
          <>
            <div className={styles.pulseRing} />
            <div className={styles.icon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="1" fill="#ef4444"/>
              </svg>
            </div>
            <h2 className={styles.title}>Confirm SOS Alert</h2>
            <p className={styles.body}>
              This will immediately notify emergency services and broadcast your precise GPS location to first responders. Only use in a genuine emergency.
            </p>
            <div className={styles.countdown}>{countdown}</div>
            <div className={styles.actions}>
              <button className={styles.cancelBtn} onClick={onClose}>CANCEL</button>
              <button className={styles.confirmBtn} onClick={handleConfirm}>SEND NOW</button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.activatedIcon}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12l3 3 5-5" stroke="#ef4444" strokeWidth="2.5"/>
              </svg>
            </div>
            <h2 className={styles.title} style={{ color: '#ef4444' }}>SOS BROADCAST ACTIVE</h2>
            <p className={styles.body}>
              Emergency services have been notified. Stay calm and wait for assistance. Your location is being broadcast continuously.
            </p>
            {userCoords && (
              <div className={styles.coordBadge}>
                📍 {userCoords.lat.toFixed(5)}, {userCoords.lng.toFixed(5)}
              </div>
            )}
            <button className={styles.cancelBtn} style={{ width: '100%', marginTop: 16 }} onClick={onClose}>CLOSE</button>
          </>
        )}
      </div>
    </div>
  );
}
