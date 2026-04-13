import { useState, useCallback } from 'react';
import { fetchResources } from '../services/overpass';
import styles from './Sidebar.module.css';

const TABS = [
  { id: 'nav', label: 'NAVIGATE' },
  { id: 'alerts', label: 'ALERTS' },
  { id: 'resources', label: 'RESOURCES' },
];

const SEVERITY_COLOR = { EXTREME: '#ef4444', HIGH: '#f59e0b', MODERATE: '#3b82f6', LOW: '#10b981' };

export default function Sidebar({
  hazards, routes, routing, selectedRouteIndex, onSelectRoute,
  onSOS, userCoords, onResourcesChange,
}) {
  const [activeTab, setActiveTab] = useState('nav');
  const [resourceType, setResourceType] = useState('shelters');
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  const loadResources = useCallback(async (type) => {
    if (!userCoords) return;
    setLoadingResources(true);
    const data = await fetchResources(type, userCoords.lat, userCoords.lng);
    setResources(data);
    onResourcesChange(data);
    setLoadingResources(false);
  }, [userCoords, onResourcesChange]);

  const handleTab = (id) => {
    setActiveTab(id);
    if (id === 'resources') loadResources(resourceType);
  };

  const handleResourceType = (type) => {
    setResourceType(type);
    loadResources(type);
  };

  return (
    <aside className={`${styles.sidebar} glass`}>
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button key={t.id} className={`${styles.tab} ${activeTab === t.id ? styles.active : ''}`} onClick={() => handleTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {/* NAVIGATE TAB */}
        {activeTab === 'nav' && (
          <div className={styles.pane}>
            <div className={styles.sectionTitle}>SAFE ROUTES</div>
            {routing.loading && <div className={styles.loadingState}><div className={styles.spinner}/><span>Calculating safe routes...</span></div>}
            {routing.error && <div className={styles.errorState}>Route calculation failed. Please try again.</div>}
            {!routing.loading && !routing.destination && (
              <p className={styles.emptyState}>Search for a destination above to calculate safety-optimized routes.</p>
            )}
            {!routing.loading && routes.map((r, i) => (
              <div
                key={r.index}
                className={`${styles.routeCard} ${i === selectedRouteIndex ? styles.activeRoute : ''}`}
                onClick={() => onSelectRoute(i)}
              >
                <div className={styles.routeHeader}>
                  <span className={styles.routeLabel}>{r.label}</span>
                  <span className={styles.safetyScore} style={{ color: r.safetyScore > 80 ? 'var(--accent-safe)' : r.safetyScore > 60 ? 'var(--accent-warning)' : 'var(--accent-hazard)' }}>
                    {r.safetyScore}% SAFE
                  </span>
                </div>
                <div className={styles.routeMeta}>
                  <span>{r.durationMin} min</span>
                  <span className={styles.dotSeparator}>•</span>
                  <span>{r.distanceKm} km</span>
                  {i === 0 && r.safetyScore > 90 && <span className={styles.bestBadge}>Best Path</span>}
                </div>
                <div className={styles.safetyBar}>
                  <div className={styles.safetyFill} style={{ width: `${r.safetyScore}%`, background: r.safetyScore > 80 ? 'var(--accent-safe)' : r.safetyScore > 60 ? 'var(--accent-warning)' : 'var(--accent-hazard)' }} />
                </div>
                {r.nearbyHazards && r.nearbyHazards.length > 0 && (
                  <div className={styles.routeHazards}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <span>{r.nearbyHazards.length} nearby alerts detected</span>
                  </div>
                )}
                {i === 0 && r.safetyScore >= 95 && (
                  <div className={styles.safetyReason}>Clear of all major incidents.</div>
                )}
                {r.nearbyHazards && r.nearbyHazards.length > 0 && i === 0 && (
                  <div className={styles.safetyReason}>Optimized to avoid active {r.nearbyHazards[0].type} zone.</div>
                )}
              </div>
            ))}

            <div className={styles.sectionTitle} style={{ marginTop: 24 }}>THREAT SUMMARY</div>
            {hazards.length === 0 ? (
              <div className={`${styles.alertCard} ${styles.safe}`}>
                <div className={styles.alertBadge} style={{ background: '#10b981' }}>CLEAR</div>
                <span className={styles.alertTitle}>No active hazards in your area.</span>
              </div>
            ) : (
              hazards.slice(0, 2).map(h => (
                <div key={h.id} className={styles.alertCard}>
                  <div className={styles.alertBadge} style={{ background: SEVERITY_COLOR[h.severity] || '#f59e0b' }}>{h.severity}</div>
                  <span className={styles.alertTitle}>{h.name}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* ALERTS TAB */}
        {activeTab === 'alerts' && (
          <div className={styles.pane}>
            <div className={styles.sectionTitle}>ACTIVE HAZARD ALERTS</div>
            {routing.loading && (
              <div className={styles.loadingState}>
                <div className={styles.spinner} />
                <span>Checking live alerts...</span>
              </div>
            )}
            {!routing.loading && hazards.length === 0 && (
              <p className={styles.emptyState}>No immediate hazards detected near your location.</p>
            )}
            {!routing.loading && hazards.map(h => {
              const color = SEVERITY_COLOR[h.severity] || '#f59e0b';
              return (
                <div key={h.id} className={styles.fullAlertCard} style={{ borderColor: `${color}30` }}>
                  <div className={styles.alertHeader}>
                    <div className={styles.alertBadge} style={{ background: color }}>{h.severity}</div>
                    <span className={styles.alertTitle}>{h.name}</span>
                  </div>
                  <p className={styles.alertRec}><strong>Action:</strong> {h.recommendation}</p>
                  <p className={styles.alertDesc}>{h.description}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* RESOURCES TAB */}
        {activeTab === 'resources' && (
          <div className={styles.pane}>
            <div className={styles.resourceTabs}>
              {['shelters', 'hospitals', 'water'].map(t => (
                <button key={t} className={`${styles.resourceTab} ${resourceType === t ? styles.activeResourceTab : ''}`} onClick={() => handleResourceType(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            {loadingResources && <div className={styles.loadingState}><div className={styles.spinner}/><span>Finding nearby resources...</span></div>}
            {!loadingResources && resources.map(r => (
              <div key={r.id} className={`${styles.resourceCard} glass`}>
                <div className={styles.resourceName}>{r.name}</div>
                <div className={styles.resourceMeta}>{r.type} · {r.opening_hours}</div>
                {r.address && r.address !== 'Address not available' && (
                  <div className={styles.resourceAddr}>{r.address}</div>
                )}
                {r.phone && <div className={styles.resourcePhone}>📞 {r.phone}</div>}
              </div>
            ))}
            {!loadingResources && resources.length === 0 && (
              <p className={styles.emptyState}>No {resourceType} found nearby. Try a larger search area.</p>
            )}
          </div>
        )}
      </div>

      <div className={styles.sosContainer}>
        <button className={styles.sosBtn} onClick={onSOS}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="1" fill="currentColor"/>
          </svg>
          SOS EMERGENCY
        </button>
      </div>
    </aside>
  );
}
