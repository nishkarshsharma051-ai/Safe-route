import styles from './PredictionSlider.module.css';

const HOUR_LABELS = ['LIVE', '+6H', '+12H', '+24H', '+48H', '+72H'];

export default function PredictionSlider({ value, onChange }) {
  const labelIndex = Math.round((value / 72) * 5);
  const label = HOUR_LABELS[labelIndex] ?? `+${value}H`;

  return (
    <div className={`${styles.panel} glass`}>
      <div className={styles.label}>
        <span className={styles.icon}>
          {value === 0
            ? <span className={styles.liveDot} />
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-info)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          }
        </span>
        <span className={styles.labelText}>{label}</span>
        {value > 0 && <span className={styles.forecast}>FORECAST</span>}
      </div>
      <input
        className={styles.slider}
        type="range"
        min="0" max="72" step="1"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
      <span className={styles.right}>+72H</span>
    </div>
  );
}
