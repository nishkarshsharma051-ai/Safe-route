import styles from './SettingsModal.module.css';

const REGIONS = [
  { id: 'nyc', label: 'New York City', size: '~48 MB' },
  { id: 'la', label: 'Los Angeles', size: '~52 MB' },
  { id: 'chicago', label: 'Chicago', size: '~39 MB' },
  { id: 'miami', label: 'Miami', size: '~31 MB' },
];

export default function SettingsModal({ isOpen, onClose, offlineRegions, onDownload }) {
  if (!isOpen) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} glass`} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Settings</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>OFFLINE MAP REGIONS</div>
          <p className={styles.sectionDesc}>Download regions for use without internet access.</p>
          {REGIONS.map(r => {
            const status = offlineRegions[r.id];
            return (
              <div key={r.id} className={styles.regionRow}>
                <div>
                  <div className={styles.regionName}>{r.label}</div>
                  <div className={styles.regionSize}>{r.size}</div>
                </div>
                {status === 'saved' ? (
                  <span className={styles.savedBadge}>✓ SAVED</span>
                ) : status ? (
                  <div className={styles.progressWrap}>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${status}%` }} />
                    </div>
                    <span className={styles.progressText}>{status}%</span>
                  </div>
                ) : (
                  <button className={styles.downloadBtn} onClick={() => onDownload(r.id)}>DOWNLOAD</button>
                )}
              </div>
            );
          })}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>EMERGENCY PROFILE</div>
          <div className={styles.profileCard}>
            <div className={styles.profileRow}><span className={styles.profileLabel}>Blood Type</span><span className={styles.profileValue}>Set in profile</span></div>
            <div className={styles.profileRow}><span className={styles.profileLabel}>Allergies</span><span className={styles.profileValue}>Set in profile</span></div>
            <div className={styles.profileRow}><span className={styles.profileLabel}>Emergency Contact</span><span className={styles.profileValue}>Not configured</span></div>
          </div>
          <p className={styles.sectionDesc} style={{marginTop: 8}}>Profile shared with emergency responders when SOS is activated.</p>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>ABOUT</div>
          <div className={styles.aboutRow}><span>Version</span><span>2.0.0 React</span></div>
          <div className={styles.aboutRow}><span>Weather Data</span>
            <span style={{color: import.meta.env.VITE_OWM_KEY ? 'var(--accent-safe)' : 'var(--accent-warning)'}}>
              {import.meta.env.VITE_OWM_KEY ? 'Live (OpenWeatherMap)' : 'Demo Mode'}
            </span>
          </div>
          <div className={styles.aboutRow}><span>Routing</span><span style={{color:'var(--accent-safe)'}}>Live (Mapbox)</span></div>
          <div className={styles.aboutRow}><span>Resources</span><span style={{color:'var(--accent-safe)'}}>Live (OpenStreetMap)</span></div>
        </section>
      </div>
    </div>
  );
}
